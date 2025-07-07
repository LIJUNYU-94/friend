// delete-connections.js

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // あなたの秘密鍵ファイル

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const ORG_ID = "orgs_aw24";

async function deleteConnectionsFromAllMembers() {
  const membersRef = db.collection("orgs").doc(ORG_ID).collection("members");
  const snapshot = await membersRef.get();

  const batch = db.batch();

  snapshot.forEach((doc) => {
    const ref = doc.ref;
    batch.update(ref, {
      connections: admin.firestore.FieldValue.delete(),
    });
  });

  await batch.commit();
  console.log("✅ 全メンバーから connections フィールドを削除しました");
}

deleteConnectionsFromAllMembers().catch((err) => {
  console.error("🔥 エラー:", err);
});
