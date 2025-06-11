// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAsuIkjIRRx3B4xKocgdSoF3TZJonos_5w",
  authDomain: "friend-team11.firebaseapp.com",
  projectId: "friend-team11",
  storageBucket: "friend-team11.appspot.com",
  messagingSenderId: "266017925446",
  appId: "1:266017925446:web:0c2b41baac600b8a601d47",
  measurementId: "G-4N671V537N",
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
export { auth };
