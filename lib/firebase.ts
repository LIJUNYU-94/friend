// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";

// import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
// @ts-ignore
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
const firebaseConfig = {
  apiKey: "AIzaSyAsuIkjIRRx3B4xKocgdSoF3TZJonos_5w",
  authDomain: "friend-team11.firebaseapp.com",
  projectId: "friend-team11",
  storageBucket: "friend-team11.appspot.com",
  messagingSenderId: "266017925446",
  appId: "1:266017925446:web:0c2b41baac600b8a601d47",
  measurementId: "G-4N671V537N",
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let auth;
if (Platform.OS === "web") {
  // Web ではふつうに getAuth だけ
  auth = getAuth(app);
} else {
  // ネイティブ側 (iOS / Android) だけ永続化を設定
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

const db = getFirestore(app);
export { auth, db };
