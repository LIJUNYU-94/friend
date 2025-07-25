// icon.tsx （超適当なページ）
import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Menu from "./menu";
type Props = {
  userIcon?: string; // 画像 URL（空ならテスト用アイコンを表示）
  role?: "admin" | "member"; // 役割
  userName?: string; // ユーザー名
  email?: string;
  orgId?: string;
};

export default function Icon({
  userIcon,
  role,
  userName,
  email,
  orgId,
}: Props) {
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
          role={role}
          userName={userName}
          userIcon={userIcon}
          email={email}
          orgId={orgId}
        />
      )}
      <Pressable
        style={{ position: "absolute", top: 12, left: 12, zIndex: 4 }}
        onPress={() => setMenuOpen(true)}
      >
        <Image
          source={
            userIcon
              ? { uri: userIcon }
              : require("../../assets/images/icon.png")
          }
          style={styles.logo}
        />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  logo: {
    width: 60,
    height: 60,
    borderRadius: 50,
    top: 60,
    left: 40,
  },
});
