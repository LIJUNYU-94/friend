// app/index.tsx
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { auth } from "../lib/firebase";
import Auth from "./auth"; // Authコンポーネントをインポート

export default function Index() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? null);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ marginTop: 80, alignItems: "center" }}>
      {/* ログイン状態に応じてAuthコンポーネントを表示 */}
      {email ? (
        <Text>ログイン済み: {email}</Text>
      ) : (
        <Auth /> // ここでAuthコンポーネントを表示
      )}
    </View>
  );
}
