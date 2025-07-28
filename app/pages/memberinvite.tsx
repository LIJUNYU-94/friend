import { db } from "@/lib/firebase";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MemberInvite() {
  const { orgId, status, email } = useLocalSearchParams<{
    orgId: string;
    status: string;
    email: string;
  }>();
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
    const snapshot = await getDocs(collection(db, "orgs", orgId, "members"));
    const existingIds = snapshot.docs.map((doc) => doc.id);
    console.log(existingIds);
    if (existingIds.includes(emailToAdd)) {
      setEmailInput("");
      setNameInput("");
      alert("すでに組織にいるよ！");
      return;
    }
    if (emailToAdd && nameInput) {
      const newMember: Member = {
        name: nameInput,
        email: emailToAdd,
      };
      setMemberList((prev) => [...prev, newMember]);
      // 既存メンバーのID一覧を取得

      try {
        await axios.post(
          "https://friend-production.up.railway.app/invite-member",
          {
            orgId: orgId,
            email: emailToAdd,
            name: nameInput,
          }
        );
        alert(`${nameInput} さんに招待を送りました`);
      } catch (err: any) {
        console.error("❌ 招待API失敗:", err);
        alert("招待中にエラーが発生しました");
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
        {status === "new" && (
          <Text style={styles.note}>あとで追加招待可能</Text>
        )}
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

      {status === "new" ? (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() =>
            router.replace({
              pathname: "/pages/adminjoin",
              params: {
                orgId: orgId,
                email: email,
              },
            })
          }
        >
          <Text style={styles.nextButtonText}>次へ</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.back()}
        >
          <Text style={styles.nextButtonText}>戻る</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF4E2",
    paddingTop: 100,
    paddingHorizontal: 20,
    height: "100%",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontFamily: "ZenMaru",
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
    fontFamily: "ZenMaru",
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
    fontFamily: "ZenMaru",
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
    fontFamily: "ZenMaru",
    fontWeight: "bold",
  },
});
