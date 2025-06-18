// app/components/Menu.tsx
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  /** 左端からスライド表示にする場合は呼び出し側で Animated.View に包む */
  onClose: () => void;
  userName?: string;
  role?: "管理者" | "メンバー";
  userIcon?: string;
};

export default function Menu({ onClose, userName, role, userIcon }: Props) {
  return (
    <View style={styles.container}>
      {/* ── ヘッダー ──────────────────────────────── */}
      <View style={styles.header}>
        <Image
          style={styles.icon}
          source={
            userIcon
              ? { userIcon } // ← ユーザーアイコン
              : require("../../assets/images/testicon.png") // ← デフォルト
          }
        />
        <Text style={styles.userText}>
          {userName}
          <Text style={{ fontWeight: "normal" }}>_{role}</Text>
        </Text>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={{ fontSize: 24 }}>✕</Text>
        </Pressable>

        <TouchableOpacity style={styles.profileBtn}>
          <Text style={styles.profileBtnText}>プロフィール編集</Text>
        </TouchableOpacity>
      </View>

      {/* ── メニュー項目 ─────────────────────────── */}
      <ScrollView contentContainerStyle={styles.menu}>
        <TouchableOpacity style={styles.item}>
          <Text style={styles.itemText}>組織情報</Text>
        </TouchableOpacity>
        {role === "管理者" && (
          <>
            <TouchableOpacity style={styles.item}>
              <Text style={styles.itemText}>コネクション設定</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item}>
              <Text style={styles.itemText}>メンバー招待</Text>
            </TouchableOpacity>
          </>
        )}
        {role === "メンバー" && (
          <>
            <TouchableOpacity style={styles.item}>
              <Text style={styles.itemText}>コネクション進捗</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── 区切り線 ─────────────────────── */}
        <View style={styles.divider} />

        {/* ── 組織選択 ─────────────────────── */}
        <View style={styles.orgBox}>
          <Text style={styles.orgLabel}>Webデザイン科</Text>
          <TouchableOpacity style={styles.orgSelect}>
            <Text style={styles.orgSelectText}>組織の選択 ▼</Text>
          </TouchableOpacity>
        </View>

        {/* ── 設定 ───────────────────────── */}
        <TouchableOpacity style={styles.item}>
          <Text style={styles.itemText}>設定</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "85%", // スライドメニュー幅
    backgroundColor: "#fff",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 5,
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
  menu: { paddingHorizontal: 24, paddingBottom: 40 },
  item: { paddingVertical: 18 },
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
});
