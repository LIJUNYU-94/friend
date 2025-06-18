// clear_user_fields.js
// users コレクションの全ドキュメントから
// hobby / icon / mbti / role を削除する

import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const sa = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: sa.project_id,
});

const db = admin.firestore();

async function main() {
  const snap = await db.collection("users").get();
  let batch = db.batch();
  let count = 0;

  snap.forEach((doc) => {
    batch.update(doc.ref, {
      hometown: FieldValue.delete(),
    });
    count++;

    // Firestore batch 上限 500 対策
    if (count % 500 === 0) {
      batch.commit();
      batch = db.batch();
    }
  });

  if (count % 500 !== 0) await batch.commit();
  console.log(`✅ ${count} docs updated`);
}

main().catch(console.error);
