// app/index.tsx
// import { useGoogleLogin } from "@/components/my-components/useGoogleLogin";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, TextInput, View } from "react-native";
import { auth, db } from "../lib/firebase";
//************************************************************開発用ログイン手段(email+password)***********************************************************//
const login = async (email: string, password: string): Promise<void> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const uid = userCredential.user.uid;
    console.log("ログイン成功 UID:", uid);
    // TODO: 必要があればユーザー情報の取得・画面遷移など
  } catch (error: any) {
    // FirebaseAuthError の型が any なので .message 付きでキャッチ
    console.error("ログイン失敗:", error.message);
    // TODO: エラー処理（例：ユーザーにトースト表示など）
    throw error; // ← これ重要！
  }
};
function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message || "ログインに失敗しました"); // ← ここでちゃんと表示する
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, width: "100%" }}>
      <TextInput
        placeholder="メールアドレス"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginBottom: 10,
          borderRadius: 4,
        }}
      />
      <TextInput
        placeholder="パスワード"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginBottom: 10,
          borderRadius: 4,
        }}
      />
      <Button
        title={loading ? "ログイン中..." : "ログイン"}
        onPress={handleLogin}
        disabled={loading}
      />

      {loading && (
        <ActivityIndicator
          size="small"
          color="#0000ff"
          style={{ marginTop: 10 }}
        />
      )}
      {error !== "" && (
        <Text style={{ marginTop: 10, color: "red" }}>
          ログインに失敗しました、アカウント名とパスワードを再確認してください
        </Text>
      )}
    </View>
  );
}
//************************************************************本番用ログイン手段(google認証)***********************************************************//
// function AuthScreen() {
//   const { promptAsync, token } = useGoogleLogin();
//   const [loading, setLoading] = useState(false);
//   const handleGoogleLogin = async () => {
//     setLoading(true);
//     try {
//       await promptAsync();
//     } catch (e) {
//       console.error("Google ログイン開始エラー:", e);
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <View style={{ marginTop: 80, alignItems: "center" }}>
//       <Text>UID: 未ログイン</Text> {/* 仮の表示 */}
//       <Button
//         title={loading ? "ログイン中..." : "Googleでログイン"}
//         onPress={handleGoogleLogin}
//         disabled={loading}
//       />
//       {loading && (
//         <ActivityIndicator
//           size="small"
//           color="#0000ff"
//           style={{ marginTop: 10 }}
//         />
//       )}
//       {token && <Text>idToken が取得できました！ (コンソールを確認)</Text>}
//     </View>
//   );
// }
export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email ?? user.displayName ?? null);

        // ↓ Firestore から名前取得
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setUserName(data.name || "名前未登録");
        } else {
          setUserName("名前未登録");
        }
        console.log("Firebase ログインユーザー:", user.uid, user.email);
      } else {
        setUserEmail(null);
        setUserName(null);
        console.log("Firebase ユーザーログアウト");
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("ログアウトしました");
    } catch (error) {
      console.error("ログアウト失敗:", error);
    }
  };
  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>認証状態を確認中...</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {userEmail ? (
        <>
          <Text style={{ marginBottom: 20 }}>ようこそ {userName}</Text>
          <Button title="ログアウト" onPress={handleLogout} />
        </>
      ) : (
        <AuthScreen />
      )}
    </View>
  );
}
