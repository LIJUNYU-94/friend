import { batches } from "@/components/my-components/batches";
import BeFriend from "@/components/my-components/beFriend";
import { myFavorites, myIf } from "@/components/my-components/customize";
import EditProfile from "@/components/my-components/editProfile";
import { getCollectionProgress } from "@/components/my-components/getCollectionProgress";
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
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type now = {
  name?: string;
  icon?: string;
  mbti?: string;
  bloodType?: string;
  birthday?: string;
  zodiac?: string;
  hometown?: string;
  hobby?: string[];
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
  const { email, org, orgId, relation, editingFromMenu, role } =
    useLocalSearchParams(); // ルーターから渡されたメール
  const myEmail = getAuth().currentUser?.email;
  const isMyProfile = email === myEmail;
  const [now, setNow] = useState<now | null>(null); //今のuser. 全体データから
  const [user, setUser] = useState<now | null>(null); //今のuser、組織から
  const [isEditing, setIsEditing] = useState(false);
  const [triggerSave, setTriggerSave] = useState(false); // 保存トリガー
  const [authWordOn, setAuthWordOn] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const data = await getCollectionProgress(
        orgId as string,
        myEmail as string
      );
      setCategories(data);
      setLoading(false);
    };

    fetchProgress();
  }, [orgId, myEmail]);
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
      alert("友達になりました,認証コード5分後に変わります！");
    } catch (error) {
      console.error("❌ connection更新失敗:", error);
    }
  };

  const handlePress = () => {
    if (isMyProfile) {
      if (isEditing) {
        // 編集完了時：編集モードOFFにしてから保存
        setTriggerSave(true); // 保存をあとで実行
        setTimeout(() => {
          setIsEditing(false);
        }, 1000); // 次の描画フレームで実行される（Reactの更新後）
      } else {
        // 編集開始時
        setIsEditing(true);
      }
    } else {
      setAuthWordOn(true); // 他人のプロフィールの場合
    }
  };
  // useEffect(() => {
  //   if (editingFromMenu === "true") {
  //     setIsEditing(true);
  //   }
  // }, [editingFromMenu]);
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
  }, [email, orgId, isEditing]);
  const rows = chunkArray(batches, 3);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* プロフィール上部 */}
      <View style={styles.subcontainer}>
        {role == "member" && (
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
        )}
        {!isEditing && (
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
        )}
        {!isEditing && (
          <>
            <View style={{ flexDirection: "row", marginTop: 60 }}>
              <Image
                source={
                  now?.icon || user?.icon
                    ? { uri: now?.icon || user?.icon } // ← ユーザーアイコン
                    : require("../../assets/images/testicon.png") // ← デフォルト
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
                        rowIndex % 2 === 1 && { marginLeft: 30 },
                      ]}
                    >
                      {row.map((batch, index) => {
                        const globalIndex = rowIndex * row.length + index;
                        const category = categories[globalIndex];

                        return (
                          <Image
                            key={index}
                            source={
                              category
                                ? category.per < 0.5
                                  ? batch.icon
                                  : category.per < 0.75
                                  ? batch.icon50
                                  : category.per < 1
                                  ? batch.icon70
                                  : batch.icon100
                                : batch.icon // categoryが無いときはデフォルトでbatch.icon表示
                            }
                            style={styles.batch}
                          />
                        );
                      })}
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
            <Text style={[styles.label, { marginVertical: 12 }]}>基本情報</Text>
            <View>
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
                  {Array.isArray(user?.hobby) && user?.hobby.length > 0
                    ? user.hobby.join(" 、 ")
                    : "未入力"}
                </Text>
              </ProfileField>
            </View>

            {!isEditing &&
              (isMyProfile || relation === "connected" ? (
                <>
                  {/* ▼ 以下、友達のみが見れる項目群 */}
                  {user?.myFavorites &&
                    Object.values(user.myFavorites).some(
                      (v) => typeof v === "string" && v.trim() !== ""
                    ) && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={[styles.label, { marginVertical: 12 }]}>
                          私のお気に入り
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            gap: 8, // React Native Paper などの環境なら使える。なければ margin で調整
                          }}
                        >
                          {Object.entries(user.myFavorites).map(
                            ([key, val]) =>
                              typeof val === "string" &&
                              val.trim() !== "" && (
                                <View
                                  key={key}
                                  style={{
                                    width: "48%", // 2カラム（横に2つ並ぶ）
                                    marginBottom: 12,
                                  }}
                                >
                                  <ProfileField
                                    label={
                                      myFavorites.find((f) => f.id === key)
                                        ?.name ?? ""
                                    }
                                  >
                                    <Text
                                      style={styles.profileText}
                                      numberOfLines={1}
                                      ellipsizeMode="tail"
                                    >
                                      {val}
                                    </Text>
                                  </ProfileField>
                                </View>
                              )
                          )}
                        </View>
                      </View>
                    )}

                  {user?.myBest3 &&
                    [
                      user.myBest3.title,
                      user.myBest3.first,
                      user.myBest3.second,
                      user.myBest3.third,
                    ].some((v) => v.trim() !== "") && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={[styles.label, { marginVertical: 12 }]}>
                          My Best 3
                        </Text>
                        <ProfileField label="テーマ">
                          <Text
                            style={[styles.profileText, { marginLeft: "10%" }]}
                          >
                            {user.myBest3.title}
                          </Text>
                        </ProfileField>
                        <ProfileField label="">
                          <Text numberOfLines={1} ellipsizeMode="tail">
                            <Text style={[styles.profileText]}>１：</Text>
                            <Text style={[styles.profileText]}>
                              {user.myBest3.first}
                            </Text>
                          </Text>
                        </ProfileField>
                        <ProfileField label="">
                          <Text numberOfLines={1} ellipsizeMode="tail">
                            <Text style={[styles.profileText]}>２：</Text>
                            <Text style={[styles.profileText]}>
                              {user.myBest3.second}
                            </Text>
                          </Text>
                        </ProfileField>
                        <ProfileField label="">
                          <Text numberOfLines={1} ellipsizeMode="tail">
                            <Text style={[styles.profileText]}>３：</Text>
                            <Text style={[styles.profileText]}>
                              {user.myBest3.third}
                            </Text>
                          </Text>
                        </ProfileField>
                      </View>
                    )}

                  {user?.myIf &&
                    Object.values(user.myIf).some(
                      (v) => typeof v === "string" && v.trim() !== ""
                    ) && (
                      <View style={{ marginBottom: 20 }}>
                        <Text style={[styles.label, { marginVertical: 12 }]}>
                          もしも...
                        </Text>

                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={true}
                        >
                          {myIf.map((q) => {
                            const val = user.myIf?.[q.id];
                            if (!val || val.trim() === "") return null;

                            return (
                              <View
                                key={q.id}
                                style={{
                                  width: 187,
                                  height: 187,
                                  borderRadius: 187,
                                  justifyContent: "center",
                                  alignItems: "center",
                                  backgroundColor: "white",
                                  marginRight: 30,
                                  marginBottom: 15,
                                  padding: 10,
                                  position: "relative",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 16,
                                    color: "#80590C",
                                    textAlign: "center",
                                    position: "absolute",
                                    top: 35,
                                  }}
                                >
                                  {q.name}
                                </Text>
                                <Text
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                  style={{
                                    color: "#80590C",
                                    marginTop: 8,
                                    fontSize: 16,
                                    textAlign: "center",
                                  }}
                                >
                                  {val}
                                </Text>
                              </View>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                  {user?.myKnowmore && user.myKnowmore.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.label, { marginVertical: 12 }]}>
                        もっと知りたい！
                      </Text>
                      {user.myKnowmore.map(
                        (k: { id: string; name?: string; answer?: string }) =>
                          (k.name?.trim() || k.answer?.trim()) && (
                            <ProfileField key={k.id} label={k.name ?? ""}>
                              <Text style={styles.profileText}>{k.answer}</Text>
                            </ProfileField>
                          )
                      )}
                    </View>
                  )}

                  {user?.myonephrase?.trim() !== "" && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.label, { marginVertical: 12 }]}>
                        ひとこと
                      </Text>
                      <Text
                        style={{
                          width: "90%",
                          minHeight: 100,
                          alignSelf: "center",
                          backgroundColor: "white",
                          padding: 30,
                          color: "#80590C",
                          fontSize: 20,
                          letterSpacing: 1,
                        }}
                      >
                        {user?.myonephrase}
                      </Text>
                    </View>
                  )}

                  {role == "member" && (
                    <TouchableOpacity
                      style={{
                        alignSelf: "center",
                        borderRadius: 29,
                        width: 200,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 5,
                        backgroundColor: "#D9D9D9",
                        marginVertical: 30,
                      }}
                      onPress={handlePress}
                    >
                      <Text
                        style={[
                          styles.label,
                          {
                            textAlign: "center",
                            alignItems: "center",
                            color: "black",
                          },
                        ]}
                      >
                        {isMyProfile ? "プロフィール編集" : "友達になる"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View>
                  <Text
                    style={{
                      fontSize: 18,
                      textAlign: "center",
                      color: "#6A4402",
                      letterSpacing: 1.5,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="eye-off"
                      size={24}
                      color="#333"
                    />
                    ここからは友達しか見れません！
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      textAlign: "center",
                      color: "#6A4402",
                      letterSpacing: 1.5,
                    }}
                  >
                    友達に話しかけて友達になりましょう！
                  </Text>
                </View>
              ))}
          </>
        )}
        {isEditing && (
          <EditProfile
            user={user}
            now={now}
            orgId={orgId}
            triggerSave={triggerSave}
            onSaveComplete={() => {
              setTriggerSave(false); // 保存後トリガーをリセット
              setIsEditing(false); // 編集モード解除
            }}
          />
        )}
        {authWordOn && (
          <BeFriend
            visible={authWordOn}
            onConnect={handleConnect}
            onClose={() => setAuthWordOn(false)}
            orgId={orgId as string}
            email={email as string}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF4e2",
    paddingVertical: 40,
    paddingTop: 100,
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
