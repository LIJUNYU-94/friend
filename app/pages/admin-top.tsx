// app/create-org.tsx （超適当なページ）
import Icon from "@/components/my-components/icon";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  //   Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../../lib/firebase"; // あなたの firebase.ts へのパスに合わせて変更
type User = {
  id: string;
  name?: string;
  email?: string;
  icon?: string;
  progress?: number; // プロフィール入力率（0–100）
};
type Props = {
  userIcon?: string; // 画像 URL（空ならテスト用アイコンを表示）
  role?: "admin" | "member"; // 役割
  userName?: string; // ユーザー名
};
const orgId = "orgs_aw24"; // ★ 固定ならここ、動的なら props で受け取る　　　複数の組織になる場合に修正すべきところ2
export default function AdminTop({ userIcon, role, userName }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  // 進捗に応じた色
  const colorOf = (p?: number) =>
    p === 100 ? "#28a745" : p === 0 ? "#c92424" : "#d98e00";
  // ── 1行レンダラー ─────────────────────────────
  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.row}>
      <Image
        style={styles.icon}
        source={
          item.icon
            ? { uri: item.icon } // ← ユーザーアイコン
            : require("../../assets/images/testicon.png") // ← デフォルト
        }
      />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name || "（名前未設定）"}
        </Text>
        <Text style={styles.email}>{item.id || "---"}</Text>
        {item.progress !== undefined && (
          <Text style={[styles.progress, { color: colorOf(item.progress) }]}>
            プロフィール入力進捗：{item.progress}%
          </Text>
        )}
      </View>
      {/* <Pressable onPress={() => removeMember(item.id)}>
        <Text>🗑</Text>
      </Pressable> */}
    </View>
  );
  // ── 画面 ─────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }
  return (
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
  );
}
// ── スタイル ───────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDEB" }, // クリーム色背景
  title: {
    fontSize: 28,
    fontWeight: "400",
    textAlign: "center",
    paddingTop: 35,
    paddingLeft: 50,
    marginBottom: 35,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginLeft: 20,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#d0d0d0",
  },
  info: { flex: 1, marginLeft: 20 },
  name: { fontSize: 18, fontWeight: "600" },
  email: { fontSize: 14, color: "#555" },
  progress: { fontSize: 14, marginTop: 2 },
});
