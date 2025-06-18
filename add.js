const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const setAllRolesToMember = async () => {
  const snapshot = await db.collection("users").get();

  for (const doc of snapshot.docs) {
    try {
      await db.collection("users").doc(doc.id).set(
        {
          selectedOrg: "",
        },
        { merge: true }
      );
      console.log(`✅ 追加: ${doc.id}`);
    } catch (err) {
      console.warn(`❌ 失敗: ${doc.id}`, err.message);
    }
  }

  console.log("🎉 全ユーザーに追加完了！");
};

setAllRolesToMember();
