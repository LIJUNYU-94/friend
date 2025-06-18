// icon.tsx （超適当なページ）
import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import Menu from "./menu";
type Props = {
  userIcon?: string; // 画像 URL（空ならテスト用アイコンを表示）
  role?: "admin" | "member"; // 役割
  userName?: string; // ユーザー名
};

export default function Icon({ userIcon, role, userName }: Props) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  return (
    <View
      pointerEvents="box-none"
      style={{
        height: "100%",
        width: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      {isMenuOpen && (
        <Menu
          onClose={() => setMenuOpen(false)}
          role={
            role === "admin"
              ? "管理者"
              : role === "member"
              ? "メンバー"
              : undefined
          }
          userName={userName}
          userIcon={userIcon}
        />
      )}
      <Pressable
        style={{ position: "absolute", top: 12, left: 12, zIndex: 4 }}
        onPress={() => setMenuOpen(true)}
      >
        <Image
          source={
            userIcon
              ? { userIcon } // ← ユーザーアイコン
              : require("../../assets/images/testicon.png") // ← デフォルト
          }
          style={{ width: 80, height: 80, borderRadius: 40 }}
        />
      </Pressable>
    </View>
  );
}
