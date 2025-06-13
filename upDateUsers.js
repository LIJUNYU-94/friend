const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const updateUsers = async () => {
  for (let i = 101; i <= 142; i++) {
    const id = String(i).padStart(4, "0");
    const email = `24aw${id}@jec.ac.jp`;
    const name = `${id}番の人`;

    try {
      // Auth に既にいるユーザーを取得（失敗しなければ存在）
      const user = await admin.auth().getUserByEmail(email);
      const uid = user.uid;

      // Firestore に name を追加・更新
      await db.collection("users").doc(uid).set(
        {
          email,
          name,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true } // ← 既存データがあっても上書きされずマージされる
      );

      console.log(`✅ Firestore 更新: ${email} → ${name}`);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        console.warn(`⚠️ Authに存在しない: ${email}`);
      } else {
        console.error(`❌ エラー: ${email}`, err.message);
      }
    }
  }

  console.log("✅ Firestore name更新 完了！");
};

updateUsers();
