// server/index.js
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error("❌ 環境変数が未設定です！");
  process.exit(1);
}
// Firebase Admin SDK の初期化
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// タイマー管理用の Map（キーは orgId:email）
const timers = new Map();

// 6桁ランダム数字生成関数
const generateRandomAuthword = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
console.log("繋いてる");
// POSTエンドポイント（React Nativeから叩く）
app.post("/start-authword-timer", async (req, res) => {
  console.log("🔥 POST受信:", req.body);
  const { orgId, email } = req.body;
  if (!orgId || !email)
    return res.status(400).json({ error: "Missing fields" });

  const key = `${orgId}:${email}`;

  // 既存のタイマーがあればキャンセル
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
  }

  // 新しいタイマーをセット（5分後にauthword更新）
  const timeout = setTimeout(async () => {
    const memberRef = db.doc(`orgs/${orgId}/members/${email}`);
    const newCode = generateRandomAuthword();

    try {
      await memberRef.update({ authword: newCode });
      console.log(`[✔] ${email} の認証コードを更新: ${newCode}`);
    } catch (err) {
      console.error(`[✘] Firestore更新失敗: ${err}`);
    }

    timers.delete(key); // タイマー情報を削除
  }, 5 * 60 * 1000); // 5分（300,000ms）

  timers.set(key, timeout);
  res.json({ status: "timer started or reset" });
});
app.post("/create-member", async (req, res) => {
  const { email, name, orgId, role } = req.body;

  try {
    const memberRef = doc(db, "orgs", orgId, "members", email); // ← email に . 含んでもOK（Node.js側なら）
    await setDoc(memberRef, {
      name,
      role,
      createdAt: serverTimestamp(),
    });

    res.status(200).json({ message: "メンバー登録成功" });
  } catch (err) {
    console.error("登録エラー:", err);
    res.status(500).json({ error: "サーバーエラー" });
  }
});
app.post("/invite-member", async (req, res) => {
  console.log("🔥 メンバー招待リクエスト:", req.body);

  const { orgId, email, name } = req.body;

  if (!orgId || !email || !name) {
    return res.status(400).json({ error: "orgId, email, name は必須です" });
  }

  try {
    // users に追加（emailをそのまま使える）
    await db.collection("users").doc(email).set(
      {
        name,
        email,
        createdAt: new Date(),
      },
      { merge: true } // 既存でも上書きしない
    );

    // orgs/{orgId}/members に追加
    await db
      .collection("orgs")
      .doc(orgId)
      .collection("members")
      .doc(email)
      .set({
        role: "pending",
      });

    console.log(`✔️ ${email} を orgs/${orgId}/members に追加しました`);
    res.json({ status: "success" });
  } catch (err) {
    console.error("✘ 招待失敗:", err);
    res.status(500).json({ error: "招待に失敗しました" });
  }
});
// サーバー起動
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
