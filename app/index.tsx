// app/index.tsx
import { useGoogleLogin } from "@/components/my-components/useGoogleLogin";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { auth } from "../lib/firebase";

function AuthScreen() {
  const { promptAsync, token } = useGoogleLogin();
  const [loading, setLoading] = useState(false);
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await promptAsync();
    } catch (e) {
      console.error("Google ログイン開始エラー:", e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={{ marginTop: 80, alignItems: "center" }}>
      <Text>UID: 未ログイン</Text> {/* 仮の表示 */}
      <Button
        title={loading ? "ログイン中..." : "Googleでログイン"}
        onPress={handleGoogleLogin}
        disabled={loading}
      />
      {loading && (
        <ActivityIndicator
          size="small"
          color="#0000ff"
          style={{ marginTop: 10 }}
        />
      )}
      {token && <Text>idToken が取得できました！ (コンソールを確認)</Text>}
    </View>
  );
}

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email ?? user.displayName ?? null);
        console.log("Firebase ログインユーザー:", user.uid, user.email);
      } else {
        setUserEmail(null);
        console.log("Firebase ユーザーログアウト");
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);
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
      {userEmail ? <Text>ログイン済み: {userEmail}</Text> : <AuthScreen />}
    </View>
  );
}
