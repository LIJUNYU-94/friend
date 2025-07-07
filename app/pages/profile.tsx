import BeFriend from "@/components/my-components/beFriend";
import ProfileField from "@/components/my-components/profileField";
import { db } from "@/lib/firebase";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
type now = {
  name?: string;
  icon?: string;
  mbti?: string;
  bloodType?: string;
  birthday?: string;
  zodiac?: string;
  hometown?: string;
  hobby?: string;
  authword?: number;
  [key: string]: any; // ← 不明なフィールドがあってもOK
};
//長すぎる名前を改行させる
const breakName = (name: string) => {
  if (!name.includes(" ")) return name; // スペースないならそのまま

  // スペース区切り（最大2つまで許容）
  const parts = name.trim().split(" ");
  const totalLength = name.replace(" ", "").length;

  // 文字数が多いときだけ改行（例：9文字以上）
  if (parts.length === 2 && totalLength >= 9) {
    return parts.join("\n");
  }

  return name; // それ以外はそのまま
};
const expireAt = Date.now() + 2 * 60 * 1000; // 今から2分後（ミリ秒）

const batches = [
  { name: "birthday", icon: require("../../assets/images/testbatch.png") },
  { name: "handshake", icon: require("../../assets/images/testbatch.png") },
  { name: "home", icon: require("../../assets/images/testbatch.png") },
  { name: "stars", icon: require("../../assets/images/testbatch.png") },
  { name: "blood", icon: require("../../assets/images/testbatch.png") },
  { name: "user", icon: require("../../assets/images/testbatch.png") },
];
const chunkArray = (arr: any[], size: number) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};
const encodeKey = (email: string) => email.replace(/\./g, "__");

export default function ProfilePage() {
  const navigation = useNavigation();
  const { email, org, orgId, relation } = useLocalSearchParams(); // ルーターから渡されたメール
  const myEmail = getAuth().currentUser?.email;
  const isMyProfile = email === myEmail;
  const [now, setNow] = useState<now | null>(null); //今のuser. 全体データから
  const [user, setUser] = useState<now | null>(null); //今のuser、組織から
  const [isEditing, setIsEditing] = useState(false);
  const [authWordOn, setAuthWordOn] = useState(false);

  const handleConnect = async () => {
    if (!orgId || !email || !myEmail) return;

    const org = typeof orgId === "string" ? orgId : orgId[0];
    const target = typeof email === "string" ? email : email[0];

    const myRef = doc(db, "orgs", org, "members", myEmail);
    const targetRef = doc(db, "orgs", org, "members", target);
    const encodedTarget = encodeKey(target);
    const encodedMe = encodeKey(myEmail);

    try {
      await updateDoc(myRef, {
        [`connections.${encodedTarget}`]: "connected",
      });

      await updateDoc(targetRef, {
        [`connections.${encodedMe}`]: "connected",
      });

      setAuthWordOn(false);
      alert("友達になりました");
    } catch (error) {
      console.error("❌ connection更新失敗:", error);
    }
  };
  const handlePress = () => {
    if (isMyProfile) {
      setIsEditing((prev) => !prev); // 編集 ↔ 編集完了 を切り替え
    } else {
      setAuthWordOn(true);
    }
  };
  useEffect(() => {
    if (!email) return;

    const q = query(
      collection(db, "users"),
      where("email", "==", email as string)
    );

    getDocs(q).then((snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as now;
        setNow(data);
      } else {
        setNow({ name: "ユーザーが存在しません" });
      }
    });
  }, [email]);
  useEffect(() => {
    if (!email || !orgId) return;

    const ref = doc(
      db,
      "orgs",
      typeof orgId === "string" ? orgId : Array.isArray(orgId) ? orgId[0] : "",
      "members",
      typeof email === "string" ? email : Array.isArray(email) ? email[0] : ""
    );

    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          setUser(snap.data());
        } else {
          console.warn("メンバーが存在しません");
          setUser(null);
        }
      })
      .catch((err) => {
        console.error("Firestore取得エラー:", err);
        setUser(null);
      });
  }, [email, orgId]);
  console.log(orgId, user, now);
  const rows = chunkArray(batches, 3);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* プロフィール上部 */}
      <View style={styles.subcontainer}>
        <View style={{ flexDirection: "row", marginTop: 60 }}>
          <Image
            source={
              now?.icon
                ? { uri: now?.icon } // ← ユーザーアイコン
                : require("../../assets/images/testicons.png") // ← デフォルト
            }
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <View style={styles.batches}>
              {rows.map((row, rowIndex) => (
                <View
                  key={rowIndex}
                  style={[
                    styles.row,
                    rowIndex % 2 === 1 && { marginLeft: 30 }, // 偶数行（index 1, 3, ...）に marginLeft
                  ]}
                >
                  {row.map((batch, index) => (
                    <Image
                      key={index}
                      source={batch.icon}
                      style={styles.batch}
                    />
                  ))}
                </View>
              ))}
            </View>
            <Text style={[styles.label, { marginTop: 20, marginLeft: 10 }]}>
              名前
            </Text>
            <Text style={[styles.name, { textAlign: "center" }]}>
              {breakName(now?.name || "（名前未設定）")}
            </Text>
            {isMyProfile && <Text>{user?.authword}</Text>}
          </View>
        </View>

        <TouchableOpacity
          style={{
            position: "absolute",
            top: 26,
            right: 30,
            borderRadius: 41,
            width: 130,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 5,
            backgroundColor: isEditing ? "#D9D9D9" : "white",
          }}
          onPress={handlePress}
        >
          {!isMyProfile && (
            <Image
              source={require("../../assets/images/handshake.png")}
              style={{ width: 24, height: 24 }}
            />
          )}

          <Text
            style={[
              styles.label,
              {
                textAlign: "center",
                alignItems: "center",
              },
            ]}
          >
            {isMyProfile ? (isEditing ? "編集完了" : "編集") : "友達になる"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 26,
            left: 30,
            borderRadius: 41,
            borderColor: "black",
            borderWidth: 1,
            width: 130,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 5,
          }}
          onPress={() => navigation.goBack()}
        >
          <Text
            style={[
              styles.label,
              { textAlign: "center", alignItems: "center" },
            ]}
          >
            戻る
          </Text>
        </TouchableOpacity>
        {authWordOn && (
          <BeFriend
            visible={authWordOn}
            onConnect={handleConnect}
            onClose={() => setAuthWordOn(false)}
            orgId={orgId as string}
            email={email as string}
          />
        )}
        <Text style={[styles.label, { marginVertical: 12 }]}>基本情報</Text>

        <ProfileField label="誕生日">
          <Text style={styles.profileText}>
            {user?.birthday || now?.birthday || "未入力"}
          </Text>
        </ProfileField>

        <ProfileField label="出身国">
          <Text style={styles.profileText}>
            {user?.hometown || now?.hometown || "未入力"}
          </Text>
        </ProfileField>

        <ProfileField label="星座">
          <Text style={styles.profileText}>
            {user?.zodiac || now?.zodiac || "未入力"}
          </Text>
        </ProfileField>

        <ProfileField label="血液型">
          <Text style={styles.profileText}>
            {user?.bloodType || now?.bloodType || "未入力"}
          </Text>
        </ProfileField>

        <ProfileField label="mbti">
          <Text style={styles.profileText}>
            {user?.mbti || now?.mbti || "未入力"}
          </Text>
        </ProfileField>

        <ProfileField label="趣味">
          <Text style={styles.profileText}>
            {user?.hobby || now?.hobby || "未入力"}
          </Text>
        </ProfileField>
        {!isMyProfile &&
          (relation === "connected" ? (
            <Text>you can view the profile</Text>
          ) : (
            <Text>you cannot view the profile</Text>
          ))}
        <Text style={[styles.label, { marginVertical: 12 }]}>
          私のお気に入り
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF4e2",
    paddingVertical: 40,
  },
  subcontainer: {
    backgroundColor: "#FFebc2",
    borderRadius: 43,
    padding: 20,
    position: "relative",
  },

  avatar: {
    width: 150,
    height: 180,
  },
  batches: { marginLeft: -8 },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  batch: {
    width: 35,
    height: 35,
    marginHorizontal: 10,
  },
  profileInfo: {
    marginLeft: 20,
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    color: "#80590C",
    letterSpacing: 1.5,
    lineHeight: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: "semibold",
    color: "#80590C",
    marginBottom: 10,
  },
  mbti: {
    fontSize: 18,
    color: "#80590C",
  },
  details: {
    marginBottom: 20,
  },
  detailItem: {
    fontSize: 14,
    color: "#80590C",
    marginVertical: 2,
  },
  hobbySection: {
    marginBottom: 20,
  },
  hobbyTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginTop: 6,
  },
  progressBar: {
    height: 8,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    marginVertical: 20,
  },
  favTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#7B5531",
  },
  favGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  favBox: {
    width: "48%",
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    fontSize: 20,
    color: "#6A4402",
    letterSpacing: 1.5,
  },
});
