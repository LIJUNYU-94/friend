const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const createUsers = async () => {
  for (let i = 101; i <= 142; i++) {
    const id = String(i).padStart(4, "0");
    const email = `24aw${id}@jec.ac.jp`;
    const password = "test1234";

    try {
      const user = await admin.auth().createUser({ email, password });
      console.log(`✅ 作成成功: ${email} → UID: ${user.uid}`);
    } catch (error) {
      console.error(`❌ 失敗: ${email}`, error.message);
    }
  }
};

createUsers();
