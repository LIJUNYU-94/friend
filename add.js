// add-connections-empty.js

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Firebaseの秘密鍵パス

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const ORG_ID = "orgs_aw24";

async function setEmptyConnectionsToAllMembers() {
  const membersRef = db.collection("orgs").doc(ORG_ID).collection("members");
  const snapshot = await membersRef.get();
  const batch = db.batch();

  snapshot.forEach((doc) => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6桁のランダム数字
    const ref = doc.ref;
    batch.update(ref, {
      authword: randomCode,
    });
  });

  await batch.commit();
  console.log("✅ 全メンバーに authword, を設定しました");
}

setEmptyConnectionsToAllMembers().catch((err) => {
  console.error("🔥 エラー:", err);
});
