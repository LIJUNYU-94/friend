// app/pages/adminjoin.tsx
import { db } from "@/lib/firebase";
import { router, useLocalSearchParams } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AdminJoin() {
  const { orgId, email } = useLocalSearchParams<{
    orgId: string;
    email: string;
  }>();
  console.log(orgId, email);
  const handleJoin = async () => {
    try {
      const memberRef = doc(db, "orgs", orgId, "members", email);
      await setDoc(memberRef, { adminjoin: "yes" }, { merge: true });

      router.replace("/"); // 必要に応じて他のページへ変更
    } catch (error) {
      Alert.alert("参加処理に失敗しました", String(error));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>管理者の参加</Text>
      <View style={styles.card}>
        <Text style={styles.text}>
          管理者でも、組織のメンバーと同じように仲良しコネクションに参加できます。
          参加メンバーが管理者の参加を歓迎する場合は「参加する」を押してください。
          {"\n\n"}
          「参加しない」を押した場合は、管理者として組織情報やメンバーの管理機能のみのご利用となります。
          {"\n\n"}「参加しない」を押した場合でも、後から参加することができます。
          {"\n\n"}
          <Text style={styles.danger}>
            「参加する」を押した場合、参加を取りやめることはできませんのでご注意ください。
          </Text>
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => {}}>
          <Text style={styles.cancelText}>参加しない</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
          <Text style={styles.joinText}>参加する</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fef4e8",
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "ZenMaru",
    color: "#5C3900",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFEBC2",
    borderRadius: 20,
    padding: 20,
    marginVertical: 24,
  },
  text: {
    color: "#5C3900",
    fontSize: 14,
    fontFamily: "ZenMaru",
    lineHeight: 22,
  },
  danger: {
    color: "#C00000",
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: "#324B8D",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  joinButton: {
    backgroundColor: "#D85038",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "bold",
  },
  joinText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
