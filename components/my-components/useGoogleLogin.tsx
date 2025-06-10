//useGoogleLogin.tsx
import * as AuthSession from "expo-auth-session";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../../lib/firebase";
WebBrowser.maybeCompleteAuthSession();

export function useGoogleLogin() {
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
  } as any);
  const [request, response, promptAsync] = useIdTokenAuthRequest({
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
    redirectUri,
  });
  console.log("responseは", response);
  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken;

      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential)
          .then((res) => {
            console.log("✅ Firebase login success:", res.user);
          })
          .catch((err) => {
            console.error("❌ Firebase login error:", err.code, err.message);
          });
      } else {
        console.warn("⚠️ idToken がありません。scopes を確認してください。");
      }
    }
  }, [response]);

  return { promptAsync };
}
