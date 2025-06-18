// orgs/orgs_aw24/members に項目追加

import admin from "firebase-admin";
import { readFileSync } from "fs";

const sa = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: sa.project_id,
});

const db = admin.firestore();

const requiredFields = [
  "birthday",
  "hobby",
  "mbti",
  "icon",
  "bloodType",
  "zodiac",
  "hometown",
];

async function main() {
  const membersRef = db
    .collection("orgs")
    .doc("orgs_aw24")
    .collection("members");
  const snap = await membersRef.get();

  let batch = db.batch();
  let count = 0;

  snap.forEach((doc) => {
    const updateObj = {};
    requiredFields.forEach((field) => {
      updateObj[field] = ""; // 空文字で追加
    });
    batch.update(doc.ref, updateObj);
    count++;

    if (count % 500 === 0) {
      batch.commit();
      batch = db.batch();
    }
  });

  if (count % 500 !== 0) await batch.commit();
  console.log(`✅ ${count} docs updated`);
}

main().catch(console.error);
