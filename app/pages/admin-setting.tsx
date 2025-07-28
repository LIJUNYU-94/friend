// admin-setting.tsx
import { db } from "@/lib/firebase";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminSetting() {
  const { role, email, orgId } = useLocalSearchParams<{
    role: string;
    email: string;
    orgId: string;
  }>();
  const [orgData, setOrgData] = useState<{
    name?: string;
    adminRole?: string;
    created?: string;
  } | null>(null);

  const [name, setname] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [establishedAt, setEstablishedAt] = useState("");

  const [location, setLocation] = useState("");

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        const docRef = doc(db, "orgs", orgId); // orgId は props などから受け取る前提
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrgData({
            name: data.name ?? "",
            adminRole: data.adminRole ?? "",
            created: data.created ?? "",
          });
        } else {
          console.log("❌ orgデータが存在しません");
        }
        // 🔽 adminユーザーとして自分のroleを更新
        const memberRef = doc(db, "orgs", orgId, "members", email);
        await updateDoc(memberRef, {
          role: "admin",
        });
      } catch (error) {
        console.error("❌ orgデータ取得エラー:", error);
      }
    };

    fetchOrgData();
  }, [orgId]);
  useEffect(() => {
    if (orgData) {
      setname(orgData.name ?? "");
      setAdminRole(orgData.adminRole ?? "");
    }
  }, [orgData]);
  const handleSubmit = async () => {
    if (!name || !adminName || !adminRole || !establishedAt || !location) {
      Alert.alert("未入力の項目があります");
      return;
    }

    try {
      const orgRef = doc(db, "orgs", orgId);
      await updateDoc(orgRef, {
        name,
        adminName,
        adminRole,
        establishedAt,
        location,
        updatedAt: new Date(),
      });

      router.replace({
        pathname: "/pages/memberinvite",
        params: { status: "new", orgId: orgId, email: email },
      });
    } catch (error) {
      Alert.alert("保存に失敗しました", String(error));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>組織の情報登録</Text>
      <Text style={styles.description}>組織のメンバーに公開される</Text>
      <Text style={styles.description}>
        組織のプロフィールを入力してください。
      </Text>
      <View style={styles.editcontainer}>
        <Text style={styles.label}>組織名</Text>
        <TextInput style={styles.input} value={name} onChangeText={setname} />

        <Text style={styles.label}>管理者名前</Text>
        <TextInput
          style={styles.input}
          value={adminName}
          onChangeText={setAdminName}
        />

        <Text style={styles.label}>管理者役割</Text>
        <TextInput
          style={styles.input}
          value={adminRole}
          onChangeText={setAdminRole}
        />

        <Text style={styles.label}>創設日</Text>
        <TextInput
          style={styles.input}
          value={establishedAt}
          onChangeText={setEstablishedAt}
        />

        <Text style={styles.label}>所在地</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.editable}>あとで編集可能</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>次へ</Text>
      </TouchableOpacity>
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
  editcontainer: {
    width: "95%",
    alignSelf: "center",
    backgroundColor: "#FFEBC2",
    padding: 20,
    paddingTop: 40,
    borderRadius: 30,
    marginVertical: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7c4b00",
    marginBottom: 24,
    textAlign: "center",
  },
  description: {
    color: "#7c4b00",
    fontSize: 14,
    marginLeft: 30,
    marginBottom: 3,
  },
  label: {
    fontSize: 16,
    color: "#80590C",
    letterSpacing: 1.5,
    lineHeight: 24,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#aaa",
    paddingVertical: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  editable: {
    color: "blue",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#002bbb",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    width: "85%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
