// app/index.tsx
import { useGoogleLogin } from "@/components/my-components/useGoogleLogin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import { auth, db } from "../lib/firebase";
import AdminTop from "./pages/admin-top";

//************************************************************本番用ログイン手段(google認証)***********************************************************//
function AuthScreen() {
  //ログイン
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
    <View
      style={{
        alignItems: "center",
        height: "90%",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* <Text>UID: 未ログイン</Text>  */}
      <View style={styles.imagecontainer}>
        <Text style={[styles.imagetext, ,]}>
          友達コネクションへ{"\n"}ようこそ
        </Text>

        <Image
          source={require("../assets/images/start1.png")}
          style={{ width: 247, resizeMode: "contain" }}
        />
      </View>
      <TouchableOpacity
        onPress={handleGoogleLogin}
        style={{ position: "absolute", top: "75%" }}
      >
        <Image
          source={require("../assets/images/googlelogin.png")} // Googleロゴ画像
          style={{
            width: 266,
            resizeMode: "contain",
          }}
        />
      </TouchableOpacity>
      {/* guide部分チェック用 */}
      {/* <Button
        title={"guide"}
        onPress={() => router.replace("/pages/guide")}
        disabled={loading}
      /> */}
      {/* guide部分チェック用 */}
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
  //初回起動のチェック
  const [firstLaunchChecked, setFirstLaunchChecked] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");
      if (hasLaunched === null) {
        // 初回起動！
        await AsyncStorage.setItem("hasLaunched", "true");
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
      setFirstLaunchChecked(true);
    };

    checkFirstLaunch();
  }, []);

  //ログイン情報
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userIcon, setUserIcon] = useState<string | null>(null);
  const [role, setRole] = useState<
    "admin" | "pending_admin" | "member" | "none" | "pending" | "elect" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();
  const [orgNow, setorgNow] = useState<string | null>();

  const { orgIdNow } = useLocalSearchParams<{ orgIdNow: string }>();
  // ★ 新規: 所属候補（orgId と role）
  const [orgCandidates, setOrgCandidates] = useState<
    { orgId: string; role: string }[]
  >([]); //matchesのデータを保存する
  useEffect(() => {
    if (firstLaunchChecked && isFirstLaunch) {
      router.replace("/pages/guide");
    }
  }, [firstLaunchChecked, isFirstLaunch]);
  useEffect(() => {
    // @ts-ignore
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email ?? user.displayName ?? null);
        // const userRef = doc(db, "users", user.uid);
        // const userSnap = await getDoc(userRef);

        // if (!userSnap.exists()) {
        //   // 初回ログインなら自動でドキュメント作成
        //   await setDoc(userRef, {
        //     name: user.displayName ?? "",
        //     role: "none", // default
        //     orgId: "",
        //   });
        //   setRole("none");
        // } else {
        //   setRole(userSnap.data().role);
        // }
        // ---------- ★ 所属組織検索ロジック ----------
        const matches: { orgId: string; role: string }[] = [];
        if (user.email) {
          const orgsSnap = await getDocs(collection(db, "orgs"));
          for (const orgDoc of orgsSnap.docs) {
            const memRef = doc(db, "orgs", orgDoc.id, "members", user.email);
            const memSnap = await getDoc(memRef);
            if (memSnap.exists()) {
              matches.push({ orgId: orgDoc.id, role: memSnap.data().role });
            }
          }
        }
        setOrgCandidates(matches);

        if (matches.length === 1) {
          // 1 件だけ → 役割確定
          setRole(matches[0].role as any);
          // 必要なら orgId を AsyncStorage 等に保存する処理をここで
        } else if (matches.length > 1) {
          setRole("elect"); // 複数あり → 仮に member 扱い、選択画面で分岐   複数の組織になる場合に修正すべきところ1
        } else {
          setRole("none"); // 未所属
        }
        // ---------- ここまで変更 ----------

        // ↓ Firestore から名前取得
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();

          setUserName(data.name || "名前未登録");
          setUserIcon(data.icon || "");
          setorgNow(data.orgNow?.toString() || "0");
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
  useEffect(() => {
    if (!orgCandidates.length) return;

    if (orgIdNow) {
      setorgNow(orgIdNow);
    } else if (orgNow !== undefined) {
      const index = parseInt(orgNow ?? "0", 10);
      if (!isNaN(index) && orgCandidates[index]) {
        setorgNow(orgCandidates[index].orgId);
      }
    }
  }, [orgCandidates, orgNow, orgIdNow]);
  const handleLogout = async () => {
    try {
      // @ts-ignore
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
        {/* <Text>認証状態を確認中...</Text> */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {userEmail ? (
        <>
          {/* <Text style={{ marginBottom: 20 }}>ようこそ {userName}</Text> */}
          {(role === "admin" || role === "member") && orgNow ? (
            <AdminTop
              userIcon={userIcon ?? undefined}
              role={role}
              userName={userName ?? undefined}
              orgId={orgNow}
            />
          ) : role === "pending_admin" ? (
            <Text>審査中画面です</Text>
          ) : role === "none" ? (
            <>
              <Text>{userName}さん、未所属</Text>
              <Text>組織招待0件あります</Text>
              {/* ここの0は招待件数から持ってくる */}
              <Button
                title="招待をチェック"
                onPress={() => router.push("/pages/view-invite")}
              />
              <Text>管理者として組織登録したいなら</Text>
              <Button
                title="組織を作成"
                onPress={() => router.push("/pages/create-org")}
              />
              <Button title="ログアウト" onPress={handleLogout} />
            </>
          ) : (
            <ActivityIndicator /> // role がまだ取得できていないとき
          )}
          {/* <Button title="ログアウト" onPress={handleLogout} /> */}
        </>
      ) : (
        <AuthScreen />
      )}
    </View>
  );
}

// ── スタイル ───────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF4E2",
    paddingTop: 35,
  },
  imagecontainer: {
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
  },
  imagetext: {
    position: "absolute",
    textAlign: "center",
    color: "#533B08",
    zIndex: 5,
    fontSize: 32,
    top: 170,
    letterSpacing: 2.5,
  },
});
