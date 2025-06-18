// add_members.js
// Firestore に orgs/<ORG_ID>/members を一括追加
// 24aw0101@jec.ac.jp 〜 24aw0142@jec.ac.jp
// role: "member", joinin: 2025-06-17

import admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore"; // ← これを追加
import { readFileSync } from "fs";

const sa = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: sa.project_id, // ← ここを必ず入れる
});

const db = admin.firestore();

async function main() {
  const orgId = "orgs_aw24"; // ← ここだけ書き換え
  const ts = Timestamp.fromDate(new Date("2025-06-17"));

  const batch = db.batch();
  for (let n = 101; n <= 142; n++) {
    const email = `24aw${String(n).padStart(4, "0")}@jec.ac.jp`;
    const docRef = db
      .collection("orgs")
      .doc(orgId)
      .collection("members")
      .doc(email); // ← ドキュメントIDをメールに

    batch.set(docRef, { role: "member", joinin: ts });
  }
  await batch.commit();
  console.log("✅ 完了");
}

main().catch(console.error);
