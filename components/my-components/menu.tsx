// app/components/Menu.tsx
import { useOrgCandidates } from "@/components/my-components/useOrgCandidates";
import { db } from "@/lib/firebase";
import { router } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
type Props = {
  /** 左端からスライド表示にする場合は呼び出し側で Animated.View に包む */
  onClose: () => void;
  userName?: string;
  role?: "admin" | "member";
  userIcon?: string;
  email?: string;
  orgId?: string;
};

export default function Menu({
  onClose,
  userName,
  role,
  userIcon,
  email,
  orgId,
}: Props) {
  const [orgData, setOrgData] = useState<any>(null);
  const [orgName, setOrgName] = useState<string>();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    orgId || null
  );
  const [currentRole, setCurrentRole] = useState<"admin" | "member">(role!); // 初期値は props の role
  const [modalVisible, setModalVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null); //memberから
  const [userDataOrigin, setUserDataOrigin] = useState<any>(null); //usersから
  const { orgCandidates, loading } = useOrgCandidates(email || "");
  const [adminjoin, setAdminjoin] = useState(false);
  const [icon, setIcon] = useState("");
  const q = query(collection(db, "users"), where("email", "==", email));
  const handleLogout = async () => {
    try {
      const auth = getAuth(); // ここでauthインスタンス取得
      await signOut(auth);
      console.log("ログアウトしました");
      router.replace("/"); // TOPページに強制遷移（戻る不可）
    } catch (error) {
      console.error("ログアウト失敗:", error);
    }
  };
  const handleChangeRole = async () => {
    if (!orgId || !email) return;

    const userRef = doc(db, "orgs", orgId, "members", email);
    const newRole = currentRole === "admin" ? "member" : "admin";

    try {
      await updateDoc(userRef, {
        role: newRole,
      });
      setCurrentRole(newRole); // ローカル状態を更新
      router.replace("/");
      console.log(`ロールを ${newRole} に変更しました`);
    } catch (err) {
      console.error("ロール変更失敗:", err);
    }
  };
  useEffect(() => {
    const fetchOrg = async () => {
      const orgRef = doc(db, "orgs", orgId as string);
      const orgSnap = await getDoc(orgRef);
      if (orgSnap.exists()) {
        const data = orgSnap.data();
        setOrgData(data); // ← useState にセット
        setOrgName(data.name);
      }
      const userRef = doc(
        db,
        "orgs",
        orgId as string,
        "members",
        email as string
      );
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data(); // ← useState にセット
        setUserData(data);
        if (data.icon) {
          setIcon(data.icon);
        }
        // 🔽 ここが追加部分
        if (data.adminjoin === "yes") {
          setAdminjoin(true);
        } else {
          setAdminjoin(false);
        }
      }
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUserDataOrigin(userData);
      }
    };

    fetchOrg();
  }, [orgId]);
  return (
    <View style={styles.container}>
      {/* ── ヘッダー ──────────────────────────────── */}
      <View style={styles.header}>
        <Image
          style={styles.icon}
          source={
            icon
              ? { uri: icon } // ← ユーザーアイコン
              : require("../../assets/images/testicon.png") // ← デフォルト
          }
        />
        <Text style={styles.userText}>
          {userName}
          <Text style={{ fontWeight: "normal" }}>
            _{role === "admin" ? "管理者" : "メンバー"}
          </Text>
        </Text>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text
            style={{
              fontSize: 24,
              paddingHorizontal: 10,
              paddingVertical: 7,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "black",
            }}
          >
            ✕
          </Text>
        </Pressable>

        {role === "member" && (
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => {
              router.push({
                pathname: "/pages/profile",
                params: {
                  editingFromMenu: "true", // 文字列渡しになるので注意
                  email: email,
                  orgId: orgId,
                  role: role,
                },
              });
              onClose(); // メニュー閉じる
            }}
          >
            <Text style={styles.profileBtnText}>プロフィール編集</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── メニュー項目 ─────────────────────────── */}
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            router.push({
              pathname: "/pages/orgprofile",
              params: { orgId: orgId, role: role },
            });
          }}
        >
          <Text style={styles.itemText}>組織情報</Text>
        </TouchableOpacity>
        {role === "admin" && (
          <>
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                router.push({
                  pathname: "/pages/hobbysetting",
                  params: {
                    email: email,
                    orgId: orgId,
                    role: role,
                  },
                });
              }}
            >
              <Text style={styles.itemText}>趣味項目設定</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                router.push({
                  pathname: "/pages/memberinvite",
                  params: {
                    orgId: orgId,
                  },
                });
              }}
            >
              <Text style={styles.itemText}>メンバー招待</Text>
            </TouchableOpacity>
          </>
        )}
        {role === "member" && (
          <>
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                router.push({
                  pathname: "/pages/collection",
                  params: {
                    myEmail: email,
                    orgId: orgId,
                    role: role,
                  },
                });
                onClose(); // メニュー閉じる
              }}
            >
              <Text style={styles.itemText}>コネクション進捗</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── 区切り線 ─────────────────────── */}
        <View style={styles.divider} />

        {/* ── 組織選択 ─────────────────────── */}
        <View style={styles.orgBox}>
          <Text style={styles.orgLabel}>{orgName}</Text>

          <TouchableOpacity
            style={styles.orgSelect}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.orgSelectText}>組織の選択 ▼</Text>
          </TouchableOpacity>

          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContent}>
                {orgCandidates.map((org, index) => (
                  <TouchableOpacity
                    key={org.orgId}
                    onPress={async () => {
                      setOrgName(org.orgId); // or org.nameがあればそれ
                      setSelectedOrgId(org.orgId);
                      setModalVisible(false);
                      const querySnapshot = await getDocs(q);
                      if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        const userRef = doc(db, "users", userDoc.id);

                        await updateDoc(userRef, {
                          orgNow: index,
                        });
                      }
                      router.replace({
                        pathname: "./.",
                      });
                    }}
                    style={styles.modalItem}
                  >
                    <Text>
                      {index + 1}：{org.name}　role：
                      {role === "admin" ? "管理者" : "メンバー"}
                    </Text>
                    {/* org.name があればそっち使ってもOK */}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text>閉じる</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
        {/* ── 設定 ───────────────────────── */}
        <View style={{ position: "absolute", left: 30, bottom: 0 }}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              handleChangeRole();
            }}
          >
            {adminjoin && currentRole === "admin" && (
              <TouchableOpacity style={styles.item} onPress={handleChangeRole}>
                <Text style={styles.itemText}>参加モードに切り替え</Text>
              </TouchableOpacity>
            )}

            {adminjoin && currentRole === "member" && (
              <TouchableOpacity style={styles.item} onPress={handleChangeRole}>
                <Text style={styles.itemText}>管理モードに切り替え</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              router.push({
                pathname: "./.",
              });
              handleLogout();
            }}
          >
            <Text style={styles.itemText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "85%", // スライドメニュー幅
    backgroundColor: "#fff",
    height: "113%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 5,
    borderTopRightRadius: 20,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#d0d0d0",
    alignSelf: "center",
    marginBottom: 8,
  },
  userText: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileBtn: {
    alignSelf: "center",
    backgroundColor: "#e6e6e6",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  profileBtnText: {
    fontSize: 12,
    color: "#555",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 6,
  },

  /* menu list */
  menu: { paddingHorizontal: 24, paddingBottom: 40, height: 600 },
  item: { paddingVertical: 15 },
  itemText: { fontSize: 16 },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 16,
  },

  /* org box */
  orgBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#000",
    padding: 12,
    marginBottom: 24,
  },
  orgLabel: { fontSize: 14, marginVertical: 4 },
  orgSelect: { marginTop: 8 },
  orgSelectText: { fontSize: 16, fontWeight: "600" },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});
