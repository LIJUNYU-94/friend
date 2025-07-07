// server/index.js
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

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

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
