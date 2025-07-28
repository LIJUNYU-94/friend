// app/index.tsx
import { useGoogleLogin } from "@/components/my-components/useGoogleLogin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import { auth, db } from "../lib/firebase";
import AdminTop from "./pages/admin-top";
import WaitingCheckScreen from "./pages/waitingCheck";

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
function NameRegister({ userEmail }: { userEmail: string }) {
  const [name, setName] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email,
      updatedAt: serverTimestamp(),
    });

    router.replace("/"); // 登録完了 → index.tsx へ戻る
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={styles.firsttext}>初めまして！</Text>
      <Text style={styles.firsttext}>{userEmail}さん</Text>
      <Text style={styles.firsttext}>お名前を入力してください</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="お名前"
        style={{
          borderColor: "#ccc",
          borderWidth: 1,
          padding: 10,
          marginTop: 10,
        }}
      />
      <Button title="登録する" onPress={handleRegister} disabled={!name} />
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
    | "admin"
    | "pending_admin"
    | "newadmin"
    | "member"
    | "none"
    | "pending"
    | "elect"
    | null
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
  const [selectedRole, setSelectedRole] = useState<"admin" | "member" | null>(
    null
  );
  useEffect(() => {
    if (firstLaunchChecked && isFirstLaunch) {
      router.replace({
        pathname: "/pages/guide",
        params: { status: "new" },
      });
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
        console.log(matches);
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
          ) : role === "newadmin" ? (
            <View
              style={{
                alignItems: "center",
                gap: 40,
                flex: 1,
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 20, color: "#80590c" }}>
                {userName}さん！
              </Text>
              <Text style={{ fontSize: 20, color: "#80590c" }}>
                組織「{orgNow}」の審査が通過しました！👏
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#0047AB",
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                }}
                onPress={() => {
                  router.push({
                    pathname: "/pages/guide",
                    params: {
                      status: "admin",
                      role: role,
                      email: userEmail,
                      orgId: orgNow,
                    },
                  });
                }}
              >
                <Text style={{ color: "white", fontSize: 16 }}>
                  初期設定へ進む
                </Text>
              </TouchableOpacity>
            </View>
          ) : role === "pending_admin" ? (
            <>
              <WaitingCheckScreen />
              <Button title="ログアウト" onPress={handleLogout} />
            </>
          ) : role === "none" && userName === "名前未登録" ? (
            <>
              <NameRegister userEmail={userEmail} />
              <Button title="ログアウト" onPress={handleLogout} />
            </>
          ) : (
            role === "none" && (
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#FFF4E2",
                  alignItems: "center",
                  paddingTop: 80,
                  paddingHorizontal: 20,
                }}
              >
                <Text style={{ fontSize: 18, color: "#999", marginBottom: 20 }}>
                  役割選択
                </Text>

                <TouchableOpacity
                  style={[
                    styles.card,
                    selectedRole === "admin" && styles.cardSelected,
                  ]}
                  onPress={() => setSelectedRole("admin")}
                >
                  <Text style={styles.cardText}>組織管理者</Text>
                </TouchableOpacity>

                {/* メンバーカード */}
                <TouchableOpacity
                  style={[
                    styles.card,
                    selectedRole === "member" && styles.cardSelected,
                  ]}
                  onPress={() => setSelectedRole("member")}
                >
                  <Text style={styles.cardText}>組織メンバー</Text>
                </TouchableOpacity>

                {/* 決定ボタン */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    selectedRole ? styles.buttonEnabled : styles.buttonDisabled,
                  ]}
                  disabled={!selectedRole}
                  onPress={() => {
                    if (!selectedRole) return;

                    const nextPage =
                      selectedRole === "admin"
                        ? "/pages/create-org"
                        : "/pages/view-invite";

                    router.replace({
                      pathname: nextPage,
                      params: {
                        userName,
                        userEmail,
                      },
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      selectedRole
                        ? styles.buttonTextEnabled
                        : styles.buttonTextDisabled,
                    ]}
                  >
                    この役割で進める
                  </Text>
                </TouchableOpacity>
              </View>
            )
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
  firsttext: {
    color: "#533B08",
    letterSpacing: 1.5,
    fontSize: 16,
  },
  card: {
    width: "75%",
    aspectRatio: 1,
    backgroundColor: "#FFEBC2",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  cardSelected: {
    backgroundColor: "#FFD78D",
  },
  cardText: {
    fontSize: 18,
    color: "#533B08",
  },
  button: {
    marginTop: 30,
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 50,
  },
  buttonDisabled: {
    backgroundColor: "#ffffff",
    borderColor: "#333",
    borderWidth: 1,
  },
  buttonEnabled: {
    backgroundColor: "#0047FF",
  },
  buttonText: {
    fontSize: 16,
    textAlign: "center",
  },
  buttonTextDisabled: {
    color: "#333",
  },
  buttonTextEnabled: {
    color: "#fff",
  },
});
