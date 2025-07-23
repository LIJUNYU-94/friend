import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MemberInvite() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const [domain, setDomain] = useState(""); // 組織ドメイン
  const [emailInput, setEmailInput] = useState(""); // メール or @前入力
  const [nameInput, setNameInput] = useState(""); // メール or @前入力
  type Member = {
    name: string;
    email: string;
  };
  const [memberList, setMemberList] = useState<Member[]>([]); // 招待リスト
  const handleAddMember = async () => {
    let emailToAdd = "";
    if (domain) {
      emailToAdd = `${emailInput}@${domain}`;
    } else {
      emailToAdd = emailInput;
    }

    if (emailToAdd && nameInput) {
      const newMember: Member = {
        name: nameInput,
        email: emailToAdd,
      };
      setMemberList((prev) => [...prev, newMember]);
      try {
        console.log("🚀 API呼び出し開始");

        await axios.post(
          "https://friend-production.up.railway.app/invite-member",
          {
            orgId: orgId,
            email: emailToAdd,
            name: nameInput,
          }
        );

        console.log("✅ API呼び出し成功");
      } catch (err) {
        console.error("❌ 招待API失敗:", err);
      }

      setEmailInput("");
      setNameInput("");
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>組織メンバーの招待</Text>

      <View style={styles.box}>
        <View style={{ marginHorizontal: 20 }}>
          {domain ? (
            <View style={styles.domainInputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="メールの@前を入力"
                placeholderTextColor="#B08804"
                value={emailInput}
                onChangeText={setEmailInput}
              />
              <Text style={styles.domainText}>@{domain}</Text>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="メンバーのGmailアドレスを入力"
              placeholderTextColor="#B08804"
              value={emailInput}
              onChangeText={setEmailInput}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="名前を入力"
            placeholderTextColor="#B08804"
            value={nameInput}
            onChangeText={setNameInput}
          />

          <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
            <Text style={styles.addButtonText}>＋</Text>
          </TouchableOpacity>

          {memberList.map((member, index) => (
            <Text key={index} style={{ color: "#80590C", marginTop: 5 }}>
              {member.name}: {member.email} {"        承諾待ち"}
            </Text>
          ))}
        </View>
        <Text style={styles.note}>あとで追加招待可能</Text>
      </View>

      <View style={styles.boxDomain}>
        <Text style={styles.domainTitle}>組織ドメインを利用する場合</Text>
        <TextInput
          style={styles.input}
          placeholder="組織ドメインを入力"
          placeholderTextColor="#B08804"
          value={domain}
          onChangeText={setDomain}
        />
      </View>

      <TouchableOpacity style={styles.nextButton}>
        <Text style={styles.nextButtonText}>次へ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF4E2",
    paddingTop: "10%",
    paddingHorizontal: 20,
    height: "100%",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 20,
    color: "#80590C",
    fontWeight: "600",
  },
  box: {
    backgroundColor: "#FFEBC2",
    height: "50%",
    paddingVertical: 30,
    borderRadius: 30,
    marginBottom: 32,
    justifyContent: "space-between",
  },
  input: {
    borderWidth: 2,
    borderColor: "#80590C",
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
    color: "#80590C",
  },
  domainInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  domainText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#80590C",
  },
  addButton: {
    backgroundColor: "#FFE8B0",
    borderWidth: 2,
    borderColor: "rgba(128, 89, 12, 0.3)",
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  addButtonText: {
    fontSize: 16,
    lineHeight: 20,
    color: "rgba(0,0, 0, 0.3)",
  },
  note: {
    textAlign: "center",
    color: "blue",
    marginTop: 10,
  },
  boxDomain: {
    backgroundColor: "#FFD581",
    padding: 20,
    borderRadius: 30,
    marginBottom: 32,
  },
  domainTitle: {
    textAlign: "center",
    color: "#80590C",
    marginBottom: 10,
  },
  nextButton: {
    backgroundColor: "#0038FF",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
