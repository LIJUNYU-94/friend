// app/create-org.tsx （超適当なページ）
import Icon from "@/components/my-components/icon";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../lib/firebase"; // あなたの firebase.ts へのパスに合わせて変更
type User = {
  id: string;
  name?: string;
  email?: string;
  icon?: string;
  progress?: number; // プロフィール入力率（0–100）
  connections?: { [key: string]: "requested" | "received" | "connected" };
  stars?: { [key: string]: "stared" };
};
type Props = {
  userIcon?: string; // 画像 URL（空ならテスト用アイコンを表示）
  role?: "admin" | "member"; // 役割
  userName?: string; // ユーザー名
};
//長すぎる名前を改行させる
const breakName = (name: string) => {
  if (!name.includes(" ")) return name; // スペースないならそのまま

  // スペース区切り（最大2つまで許容）
  const parts = name.trim().split(" ");
  const totalLength = name.replace(" ", "").length;

  // 文字数が多いときだけ改行（例：9文字以上）
  if (parts.length === 2 && totalLength >= 9) {
    return parts.join("\n");
  }

  return name; // それ以外はそのまま
};
//
const orgId = "orgs_aw24"; // ★ 固定ならここ、動的なら props で受け取る　　　複数の組織になる場合に修正すべきところ2
export default function AdminTop({ userIcon, role, userName }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedCount, setConnectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  //管理者専用：
  //ユーザー専用：
  const userColumns = 2;
  const myEmail = getAuth().currentUser?.email;
  const [myStars, setMyStars] = useState<Record<string, string>>({});
  const [org, setOrg] = useState("");
  const orgRef = doc(db, "orgs", orgId);
  const encodeKey = (email: string): string => email.replace(/\./g, "__");
  const decodeKey = (key: string) => key.replace(/__/g, ".");
  getDoc(orgRef).then((docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      setOrg(data.name);
    }
  });

  /*-----------------------------------------------------------
    useEffect 内を全面改修
    1. orgs/orgId/members を監視
    2. name は users から取得
  -----------------------------------------------------------*/
  useEffect(() => {
    const membersQuery = query(
      collection(db, "orgs", orgId, "members"),
      where("role", "in", ["member", "admin"]) // ← ここで絞り込み
    );
    const unsub = onSnapshot(membersQuery, async (snap) => {
      setLoading(true);

      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          // ★ name は email で users を検索して取得
          const uQuery = query(
            collection(db, "users"),
            where("email", "==", d.id),
            limit(1)
          );
          const uSnap = await getDocs(uQuery);

          const name = uSnap.docs[0]?.data().name ?? "";

          // ----- ★ ここで進捗を計算 -----
          const fields = [
            "birthday",
            "hobby",
            "mbti",
            "icon",
            "bloodType",
            "zodiac",
            "hometown",
          ]; // 必須項目リスト
          const filled = fields.filter((k) => data[k] !== "").length;
          const progress = Math.round((filled / fields.length) * 100);
          // --------------------------------

          return { id: d.id, name, ...data, progress };
        })
      );

      // 並べ替え（メール末尾の数字順想定）
      list.sort((a, b) => {
        const numA = parseInt(a.id.match(/(\d{4})/)?.[1] ?? "0", 10);
        const numB = parseInt(b.id.match(/(\d{4})/)?.[1] ?? "0", 10);
        return numA - numB;
      });

      setUsers(list);
      setLoading(false);
    });

    return unsub;
  }, []);
  //お気に入りチェック
  useEffect(() => {
    if (!myEmail) return;
    const userRef = doc(db, "orgs", orgId, "members", myEmail);
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const connections = data.connections ?? {};
        const snapshot = await getDocs(
          collection(db, "orgs", orgId, "members")
        );
        const total = snapshot.size; // ← ドキュメント数がそのまま人数！

        // 自分が connected としてる相手の数を数える
        const count = Object.values(connections).filter(
          (v) => v === "connected"
        ).length;
        setTotalCount(total);
        setConnectedCount(count);
        setMyStars(data.stars || {});
      }
    });

    return unsubscribe;
  }, [myEmail]);
  //お気に入りチェック
  const didIStar = (targetEmail: string | undefined): boolean => {
    if (!targetEmail) {
      return false;
    }
    return myStars[targetEmail] === "stared";
  };
  //お気に入りマックの切り替え
  const toggleStar = async (targetEmail: string | undefined) => {
    if (!myEmail || !targetEmail) return;
    const userRef = doc(db, "orgs", orgId, "members", myEmail); // ← ここ自分の stars の場所に応じて変えて
    const updatedStars = { ...myStars };

    if (myStars[targetEmail] === "stared") {
      delete updatedStars[targetEmail]; // ★ 削除
    } else {
      updatedStars[targetEmail] = "stared"; // ☆ 追加
    }

    await updateDoc(userRef, {
      stars: updatedStars,
    });

    setMyStars(updatedStars); // ローカルも更新
  };

  // 進捗に応じた色
  const colorOf = (p?: number) =>
    p === 100 ? "#28a745" : p === 0 ? "#c92424" : "#d98e00";
  // ── 1行レンダラー ─────────────────────────────
  const renderItem = ({ item }: { item: User }) => {
    const getConnectionStatus = (
      item: User,
      myEmail: string | undefined
    ): string => {
      if (!myEmail || !item.connections) return "none";

      const encodedEmail = encodeKey(myEmail);
      return item.connections[encodedEmail] ?? "none"; // "connected" / "none"
    };
    const connectionStatus = getConnectionStatus(item, myEmail ?? undefined);
    return (
      <View
        style={[
          role === "member" ? styles.row2 : styles.row1,
          role === "member" &&
            connectionStatus === "connected" && {
              backgroundColor: "#ffd581",
            },
        ]}
      >
        <Pressable //押したら他の人のプロフィールに入る
          onPress={() =>
            router.push({
              pathname: "/pages/profile",
              params: {
                email: item.id,
                org: org,
                orgId: orgId,
                relation: connectionStatus || "",
              }, // ← 他人のプロフィール
            })
          }
        >
          <Image
            style={{ width: 94, height: 94 }}
            source={
              item.icon
                ? { uri: item.icon } // ← ユーザーアイコン
                : require("../../assets/images/testicon.png") // ← デフォルト
            }
          />
        </Pressable>
        <Text style={[styles.mark, { right: 10, backgroundColor: "white" }]}>
          {role === "member" && connectionStatus === "connected" && "✔︎"}
        </Text>
        <Text style={[styles.mark, { left: 10 }]}>
          {role === "member" && (
            <TouchableOpacity onPress={() => toggleStar(item.id)}>
              <Text style={{ fontSize: 18 }}>
                {didIStar(item.id) ? "★" : "☆"}
              </Text>
            </TouchableOpacity>
          )}
        </Text>
        <View style={[styles.info, role === "member" && { marginLeft: 0 }]}>
          <Text
            style={[styles.name, role === "member" && { marginTop: 25 }]}
            numberOfLines={2}
          >
            {breakName(item.name || "（名前未設定）")}
          </Text>
          {role === "admin" && (
            <Text style={styles.email}>{item.id || "---"}</Text>
          )}
          {item.progress !== undefined && role === "admin" && (
            <Text style={[styles.progress, { color: colorOf(item.progress) }]}>
              プロフィール入力進捗：{item.progress}%
            </Text>
          )}
        </View>
        {/* <Pressable onPress={() => removeMember(item.id)}>
        <Text>🗑</Text>
      </Pressable> */}
      </View>
      // </Pressable>
    );
  };
  // ── 画面 ─────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }
  return (
    <>
      {role === "admin" && (
        <SafeAreaView style={styles.container}>
          <Icon userIcon={userIcon} role={role} userName={userName} />
          <Text style={styles.title}>参加メンバーの管理</Text>

          <FlatList
            style={{ flex: 1 }}
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          />
        </SafeAreaView>
      )}
      {role === "member" && (
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
            />
            <Text style={styles.article}>
              こんにちは！{"\n"}Webデザイン科の{userName}！{"\n"}
              今日は誰と仲良くなりたい？
            </Text>
          </View>
          <View style={styles.progress2}>
            <View>
              <Text style={styles.article}>
                コネクション進捗：{connectedCount} / {totalCount}
              </Text>

              <View style={styles.progressBarBackground}>
                <View style={styles.progressBarBackgroundbar}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${(connectedCount / totalCount) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
            <TouchableOpacity style={{ alignSelf: "center", marginLeft: 20 }}>
              <Text style={{ color: "#80590C", fontSize: 16 }}>もっと見る</Text>
            </TouchableOpacity>
            <AntDesign name="right" size={16} color="#80590C" />
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/pages/profile",
                params: { email: myEmail, org: org, orgId: orgId }, // ← 自分のプロフィール
              })
            }
          >
            <View
              style={[
                styles.progress2,
                {
                  paddingVertical: 5,
                  paddingHorizontal: 28,
                  justifyContent: "space-between",
                  marginTop: 23,
                  marginBottom: 35,
                },
              ]}
            >
              <Image
                source={
                  userIcon
                    ? { uri: userIcon }
                    : require("../../assets/images/testicon.png")
                }
                style={styles.logo}
              />
              <Text
                style={[styles.name, { marginLeft: "-35%" }]}
                numberOfLines={1}
              >
                {userName || "（名前未設定）"}
              </Text>
              <AntDesign name="right" size={16} color="#80590C" />
            </View>
          </Pressable>
          <FlatList
            style={{
              flex: 1,
              backgroundColor: "#FFEBC2",
              borderRadius: 43,
              paddingVertical: 42,
              paddingHorizontal: 12,
              gap: 20,
            }}
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 24,
            }}
            scrollEnabled={false}
            columnWrapperStyle={{
              justifyContent: "space-around",
              marginBottom: 16,
            }}
            numColumns={userColumns}
          />
        </ScrollView>
      )}
    </>
  );
}
// ── スタイル ───────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF4E2",
  }, // クリーム色背景
  title: {
    fontSize: 28,
    fontWeight: "400",
    textAlign: "center",
    paddingTop: 35,
    paddingLeft: 50,
    marginBottom: 35,
    color: "#80590C",
  },
  row1: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginLeft: 20,
  },
  row2: {
    position: "relative",
    alignItems: "center",
    paddingVertical: 25,
    width: "45%",
    backgroundColor: "#ffebc2",
    borderRadius: 28,
    height: 200,
    // 影（iOS向け）
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,

    // 影（Android向け）
    elevation: 4,
  },

  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#d0d0d0",
  },
  logo: {
    width: 46,
    height: 46,
  },
  info: {
    flex: 1,
    marginLeft: 20,
    flexWrap: "wrap",
    flexDirection: "row",
    color: "#80590C",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#80590C",
  },
  email: { fontSize: 14, color: "#555" },
  progress: { fontSize: 14, marginTop: 2 },
  mark: {
    position: "absolute",
    top: 10,
    height: 20,
    width: 20,
    borderRadius: 20,
    textAlign: "center",
    alignItems: "center",
  },
  progress2: {
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    flexDirection: "row",
    fontSize: 14,
    paddingVertical: 17,
    paddingHorizontal: 15,
    width: "85%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28.5,
  },
  article: { fontSize: 16, color: "#80590C", lineHeight: 20 },
  header: {
    marginVertical: 20,
    width: "65%",
    marginLeft: "14%",
    flexDirection: "row", // ← これだけで横並びになる
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressBarBackground: {
    height: 6,
    overflow: "hidden",
  },
  progressBarBackgroundbar: {
    backgroundColor: "#AAA",
    borderRadius: 7,
    height: 4,
  },
  progressBarFill: {
    bottom: 1,
    height: 6,
    backgroundColor: "#002ab3", // 必要に応じて変更可
    borderRadius: 3,
  },
});
