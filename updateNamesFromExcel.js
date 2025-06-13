const admin = require("firebase-admin");
const XLSX = require("xlsx");
const fs = require("fs");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const updateNames = async () => {
  const workbook = XLSX.readFile("users.xlsx");
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const users = XLSX.utils.sheet_to_json(sheet);

  for (const user of users) {
    if (!user.email || !user.name) continue;

    try {
      const userRecord = await admin.auth().getUserByEmail(user.email);
      const uid = userRecord.uid;

      await db.collection("users").doc(uid).set(
        {
          name: user.name,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`✅ 更新: ${user.email} → ${user.name}`);
    } catch (err) {
      console.warn(`❌ 失敗: ${user.email}`, err.message);
    }
  }

  console.log("🎉 名前の一括更新完了！");
};

updateNames();
