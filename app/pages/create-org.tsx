import { db } from "@/lib/firebase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Button,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateOrg() {
  const { userName, userEmail } = useLocalSearchParams<{
    userName: string;
    userEmail: string;
  }>();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("学校");
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [customCategory, setCustomCategory] = useState(""); // 自由入力カテゴリ
  const [modalVisible, setModalVisible] = useState(false); // モーダル表示状態
  const handleCreateOrg = async () => {
    if (!orgName || !selectedCategory) return;

    const orgRef = doc(db, "orgs", orgId); // 明示的にID指定

    try {
      await setDoc(orgRef, {
        name: orgName,
        category: selectedCategory,
        adminRole: adminRole,
        created: serverTimestamp(),
        hobbys: [
          "ファッション",
          "旅行",
          "読書",
          "音楽",
          "絵を描く",
          "スポーツ",
          "アニメ",
          "ゲーム",
        ],
        message: "まだ何も書かれていません。",
      });
      await fetch("https://friend-production.up.railway.app/create-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          orgId: orgId,
          role: "pending_admin",
        }),
      });
      router.push({
        pathname: "/pages/waitingCheck",
        params: { status: "new" },
      });
      console.log("✅ 組織を作成しました:", orgRef.id);
    } catch (error) {
      console.error("❌ 組織の作成に失敗:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>組織登録</Text>

      {/* カテゴリ選択 */}
      <View style={styles.categoryContainer}>
        <Text style={styles.label}>組織カテゴリ</Text>
        <View style={styles.categoryButtons}>
          {["学校", "サークル", "会社", "バイト先"].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                selectedCategory === cat && styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.selectedCategoryText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}

          {/* 「＋」ボタン */}
          <TouchableOpacity
            style={[
              styles.categoryButton,
              {
                backgroundColor:
                  selectedCategory === customCategory ? "#EC8429" : "#fff",
              },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={{ textAlign: "center" }}>
              {customCategory ? customCategory : "＋"}
            </Text>
          </TouchableOpacity>
        </View>
        {/* 入力フィールド */}
        <Text style={styles.label}>組織id(英文字、数字で)</Text>
        <TextInput value={orgId} onChangeText={setOrgId} style={styles.input} />
        <Text style={styles.label}>組織名</Text>
        <TextInput
          value={orgName}
          onChangeText={setOrgName}
          style={styles.input}
        />
        <Text style={styles.label}>管理者名前</Text>
        <TextInput
          placeholder="例：山口太一"
          value={adminName}
          onChangeText={setAdminName}
          style={styles.input}
        />
        <Text style={styles.label}>管理者役割</Text>
        <TextInput
          placeholder="例：先生"
          value={adminRole}
          onChangeText={setAdminRole}
          style={styles.input}
        />
      </View>

      {/* 送信ボタン */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleCreateOrg}
        disabled={!orgName || !adminName || !adminRole}
      >
        <Text style={styles.submitText}>送信</Text>
        <Image source={require("../../assets/images/submitplane.png")} />
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              width: "80%",
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: 20,
            }}
          >
            <Text>自由入力カテゴリ</Text>
            <TextInput
              placeholder="例：ゼミ、研究会 など"
              value={customCategory}
              onChangeText={setCustomCategory}
              style={{
                borderColor: "#ccc",
                borderWidth: 1,
                padding: 10,
                marginVertical: 10,
              }}
            />
            <Button
              title="このカテゴリを使う"
              onPress={() => {
                setSelectedCategory(customCategory);
                setModalVisible(false);
              }}
              disabled={!customCategory}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF4E2",
    padding: 30,
    paddingTop: 100,
  },
  title: {
    fontSize: 20,
    fontFamily: "ZenMaru",
    textAlign: "center",
    marginBottom: 40,
    color: "#533B08",
  },
  categoryContainer: {
    marginBottom: 20,
    backgroundColor: "#FFEBC2",
    padding: 20,
    borderRadius: 20,
  },
  label: {
    marginBottom: 10,
    fontSize: 14,
    color: "#80590c",
    fontFamily: "ZenMaru",
  },
  categoryButtons: {
    alignSelf: "center",
    width: "80%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 30,
    marginBottom: 50,
  },
  categoryButton: {
    paddingVertical: 6,
    width: 100,

    borderRadius: 15,
    backgroundColor: "#fff",
    borderColor: "grey",
    borderWidth: 1,
  },
  selectedCategoryButton: {
    backgroundColor: "#EC8429",
  },
  categoryText: {
    color: "#333",
    textAlign: "center",
  },
  selectedCategoryText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#FFEBC2",
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
  },
  submitButton: {
    backgroundColor: "#0047FF",
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  submitText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: 500,
    fontFamily: "ZenMaru",
  },
});
