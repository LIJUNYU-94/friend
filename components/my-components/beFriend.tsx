// beFriend.tsx

import { db } from "@/lib/firebase"; // あなたのFirebase設定ファイル
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import React, { useRef, useState } from "react";

import {
  Image,
  Modal,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConnect: () => void;
  orgId: string;
  email: string;
};
const PASSWORD_LENGTH = 6;

export default function BeFriend({
  visible,
  onClose,
  onConnect,
  orgId,
  email,
}: Props) {
  const [password, setPassword] = useState<string[]>(
    Array(PASSWORD_LENGTH).fill("")
  );
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const updated = [...password];
    updated[index] = text;
    setPassword(updated);

    // 次へ自動フォーカス
    if (text && index < PASSWORD_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleSuccess = async () => {
    try {
      await fetch(
        "https://friend-production.up.railway.app/start-authword-timer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orgId,
            email,
          }),
        }
      );
      console.log("認証コード5分後に変わる！");
    } catch (err) {
      console.error("❌ タイマー送信失敗:", err);
    }

    onConnect(); // ← 呼び出して親コンポーネントに知らせる
  };
  const handleSubmit = async () => {
    const inputCode = password.join(""); // 6桁の文字列を結合

    try {
      // ✅ メンバーのドキュメント参照
      if (!orgId || !email) {
        console.error("❌ orgId または email が未定義です");
        return;
      }
      const memberRef = doc(db, "orgs", orgId, "members", email);

      // ✅ ドキュメント取得
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists()) {
        const authword = memberSnap.data().authword;
        if (authword === inputCode) {
          handleSuccess();
        } else {
          alert(
            "認証コードが間違えています。\n友達にもう一度聞いてみましょう。"
          );
        }
      } else {
        console.log("❌ メンバーが存在しません");
      }
    } catch (error) {
      console.error("⚠️ Firestore取得エラー:", error);
    }
  };
  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && password[index] === "") {
      if (index > 0) {
        // 前のフィールドへ移動 + 前の文字を削除
        const updated = [...password];
        updated[index - 1] = "";
        setPassword(updated);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <View style={styles.closeCircle}>
              <Ionicons name="close" size={28} color="#7A4E00" />
            </View>
          </TouchableOpacity>

          <Text style={styles.headerText}>
            友達に声をかけてフォローしましょう
          </Text>

          {/* Step 1 */}
          <View style={styles.stepBox}>
            <Text style={styles.stepLabel}>step1</Text>
            <Text style={styles.stepText}>友達に認証番号を聞きましょう</Text>
          </View>

          {/* Step 2 */}
          <View style={styles.stepBox}>
            <Text style={styles.stepLabel}>step2</Text>
            <Text style={styles.stepText}>認証番号を入力してください</Text>
            <View style={styles.inputRow}>
              {password.map((value, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => {
                    inputRefs.current[idx] = ref;
                  }}
                  style={styles.inputBox}
                  maxLength={1}
                  value={value}
                  onChangeText={(text) => handleChange(text, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  keyboardType="default"
                  returnKeyType="next"
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.friendButton}
              onPress={handleSubmit}
            >
              <View style={styles.friendButtonContent}>
                <Image
                  source={require("../../assets/images/handshake.png")}
                  style={styles.friendButtonIcon}
                />
                <Text style={styles.friendButtonText}>友達になる</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Step 3 */}
          <View style={styles.stepBox}>
            <Text style={styles.stepLabel}>step3</Text>
            <Text style={styles.stepText}>
              非公開プロフィールが閲覧できます
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    position: "relative",
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: -18,
    right: -18,
    zIndex: 10,
  },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9D481",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: 16,
    color: "#5B3A00",
    marginBottom: 20,
    letterSpacing: 1.3,
  },
  stepBox: {
    backgroundColor: "#FFF4E2",
    borderRadius: 15,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    alignItems: "center",
  },
  stepLabel: {
    letterSpacing: 1.1,
    fontSize: 16,
    fontWeight: "bold",
    color: "#0047B2",
    marginTop: 8,
    marginBottom: 12,
  },
  stepText: {
    fontSize: 16,
    color: "#5B3A00",
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 30,
  },
  inputBox: {
    width: 36,
    height: 40,
    backgroundColor: "#ddd",
    borderRadius: 6,
    textAlign: "center",
    fontSize: 18,
    marginHorizontal: 3,
  },
  friendButton: {
    borderColor: "#7A4E00",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 60,
  },
  friendButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  friendButtonIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  friendButtonText: {
    fontSize: 16,
    color: "#7A4E00",
    letterSpacing: 1.5,
  },
});
