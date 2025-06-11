//useGoogleLogin.tsx
import { useAuthRequest } from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
WebBrowser.maybeCompleteAuthSession();

export function useGoogleLogin() {
  const [token, setToken] = useState<string | null>(null); // idToken を保持
  const [request, response, promptAsync] = useAuthRequest({
    // @ts-expect-error expoClientId 型定義がまだ反映されていない
    expoClientId:
      "266017925446-u2pcs8mfomg1mgqjte3taprv5qe76b64.apps.googleusercontent.com",
    iosClientId:
      "266017925446-etdvsflt21n3rs5sbvhcf9d5m7bk7afh.apps.googleusercontent.com",
    androidClientId:
      "266017925446-di03svkvsqojbjgbv7q5ll5q7kgob65l.apps.googleusercontent.com",
    webClientId:
      "266017925446-u2pcs8mfomg1mgqjte3taprv5qe76b64.apps.googleusercontent.com",
    scopes: ["openid", "profile", "email"],
  });
  console.log("responseは", response);
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.idToken) {
        const credential = GoogleAuthProvider.credential(
          authentication.idToken
        );
        signInWithCredential(auth, credential)
          .then((userCredential) => {
            console.log("✅ Firebase login success:", userCredential.user);
            // idToken が存在する場合のみセットし、存在しない場合は null を設定
            setToken(authentication.idToken ?? null);
          })
          .catch((error) => {
            console.error(
              "❌ Firebase login error:",
              error.code,
              error.message
            );
            setToken(null); // エラー時も null にリセット
          });
      } else {
        console.warn("⚠️ idToken が認証レスポンスに含まれていません。");
        setToken(null); // idToken がない場合も null にセット
      }
    } else if (response?.type === "cancel") {
      console.log("Google ログインがキャンセルされました。");
      setToken(null); // キャンセル時も null にリセット
    } else if (response?.type === "error") {
      console.error("Google ログインエラー:", response.error);
      setToken(null); // エラー時も null にリセット
    }
  }, [response]);

  return {
    promptAsync,
    token, // idToken を外部に公開
    request, // デバッグ用にリクエストオブジェクトも公開
  };
}
