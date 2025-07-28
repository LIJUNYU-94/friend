import { db } from "@/lib/firebase";
import { Picker } from "@react-native-picker/picker";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { customize, myFavorites, myIf } from "./customize";
import UploadIcon from "./uploadToCloudinary";

type EditProfileProps = {
  user: any;
  now: any;
  orgId: string | string[];
  triggerSave: boolean;
  onSaveComplete: () => void;
};

function getZodiacFromDate(date: Date): string {
  //////////////自動生成星座。
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "水瓶座";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "魚座";
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "牡羊座";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "牡牛座";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return "双子座";
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return "蟹座";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "獅子座";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "乙女座";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23))
    return "天秤座";
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return "蠍座";
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21))
    return "射手座";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
    return "山羊座";
  return "不明";
}
const EditProfile: React.FC<EditProfileProps> = ({
  user,
  now,
  orgId,
  triggerSave,
  onSaveComplete,
}) => {
  const orgIdStr = Array.isArray(orgId) ? orgId[0] : orgId;
  //nowはusers userはmembers
  // "8月1日" のような形式を前提にする
  const parseBirthday = (birthdayStr: string) => {
    const match = birthdayStr.match(/^(\d{1,2})月(\d{1,2})日$/);
    if (match) {
      return {
        month: parseInt(match[1], 10),
        day: parseInt(match[2], 10),
      };
    }
    // パース失敗時のデフォルト
    return { month: 1, day: 1 };
  };

  const initialParsed = parseBirthday(user.birthday || "1月1日");

  const [birthday, setBirthday] = useState(user.birthday || "1月1日");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    initialParsed.month
  );

  const [selectedDay, setSelectedDay] = useState<number>(initialParsed.day);
  const [isEditingBirthday, setEditingBirthday] = useState(false);
  const [zodiac, setZodiac] = useState(user.zodiac);
  const [countries, setCountries] = useState<string[]>([]);
  const [hometown, sethometown] = useState(user.hometown);
  const [customhometown, setCustomhometown] = useState("");
  const [isEditinghometown, setEditinghometown] = useState(false);
  const uniqueCountries = Array.from(new Set(countries));
  const [mbti, setMbti] = useState(user.mbti);
  const [isEditingMbti, setEditingMbti] = useState(false);
  const [bloodType, setBloodType] = useState(user.bloodType);
  const [isEditingBlood, setEditingBlood] = useState(false);
  const bloodOptions = ["A型", "B型", "O型", "AB型", "知らない"];
  const [imageUri, setImageUri] = useState<string | number | null>(null);
  const [availableHobbys, setAvailableHobbys] = useState<string[]>([]);
  const [hobby, sethobby] = useState<string[]>(user.hobby);
  const [isEditingHobby, setEditingHobby] = useState(false);
  const [isEditingCustomize, setEditingCustomize] = useState(false);
  const [selectedFavors, setSelectedFavors] = useState<{
    [key: string]: boolean;
  }>({});
  const [userFavorites, setUserFavorites] = useState<{ [key: string]: string }>(
    {}
  );
  const [userBest3, setUserBest3] = useState<{
    title: string;
    first: string;
    second: string;
    third: string;
  }>({ title: "", first: "", second: "", third: "" });
  const [userIf, setUserIf] = useState<{ [key: string]: string }>({});
  const [userKnowmore, setUserKnowmore] = useState<
    {
      id: string;
      name: string;
      answer: string;
    }[]
  >([]);
  const [userOnePhrase, setUserOnePhrase] = useState<string>("");
  // ✅ この useEffect はそのあとに置く！
  useEffect(() => {
    setSelectedFavors((prev) => {
      const next = { ...prev };

      if (
        userFavorites &&
        Object.values(userFavorites).some((v) => v.trim() !== "")
      ) {
        next["myFavorites"] = true;
      }

      if (
        userBest3 &&
        [
          userBest3.title,
          userBest3.first,
          userBest3.second,
          userBest3.third,
        ].some((v) => v.trim() !== "")
      ) {
        next["myBest3"] = true;
      }

      if (userIf && Object.values(userIf).some((v) => v.trim() !== "")) {
        next["myIf"] = true;
      }

      if (userKnowmore && userKnowmore.length > 0) {
        next["myKnowmore"] = true;
      }

      if (userOnePhrase && userOnePhrase.trim() !== "") {
        next["myonephrase"] = true;
      }

      return next;
    });
  }, [userFavorites, userBest3, userIf, userKnowmore, userOnePhrase]);
  useEffect(() => {
    const loadUser = async () => {
      const docSnap = await getDoc(
        doc(db, "orgs", orgIdStr, "members", now.email)
      );

      if (!docSnap.exists()) return;

      const data = docSnap.data();

      // myFavorites
      const resultFavorites: { [key: string]: string } = {};
      myFavorites.forEach((fav) => {
        resultFavorites[fav.id] = data.myFavorites?.[fav.id] || "";
      });
      setUserFavorites(resultFavorites);

      // myIf
      const resultIf: { [key: string]: string } = {};
      myIf.forEach((q) => {
        resultIf[q.id] = data.myIf?.[q.id] || "";
      });
      setUserIf(resultIf);

      // myBest3
      setUserBest3({
        title: data.myBest3?.title || "",
        first: data.myBest3?.first || "",
        second: data.myBest3?.second || "",
        third: data.myBest3?.third || "",
      });

      // myKnowmore（配列形式）
      setUserKnowmore(data.myKnowmore || []);

      // myonephrase（1行文字列）
      setUserOnePhrase(data.myonephrase || "");
    };

    loadUser();
  }, []);

  const handleToggle = (id: string) => {
    setSelectedFavors((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const handlehometownChange = (value: string) => {
    if (value === "その他") {
      sethometown(""); // クリア
    } else {
      sethometown(value);
      setCustomhometown("");
    }
  };
  const handleSave = async () => {
    const filteredFavorites = Object.fromEntries(
      Object.entries(userFavorites).filter(([_, v]) => v.trim() !== "")
    );

    const filteredIf = Object.fromEntries(
      Object.entries(userIf).filter(([_, v]) => v.trim() !== "")
    );

    const filteredBest3 = Object.fromEntries(
      Object.entries(userBest3).filter(([_, v]) => v.trim() !== "")
    );
    console.log(userKnowmore);
    const filteredKnowmore = userKnowmore.filter(
      (v) =>
        typeof v.name === "string" &&
        typeof v.answer === "string" &&
        (v.name.trim() !== "" || v.answer.trim() !== "")
    );
    console.log(filteredKnowmore);

    const onePhrase = userOnePhrase.trim();
    const dataToUpdate: { [key: string]: any } = {};
    if (Object.keys(filteredFavorites).length > 0)
      dataToUpdate.myFavorites = filteredFavorites;
    if (Object.keys(filteredIf).length > 0) dataToUpdate.myIf = filteredIf;
    if (Object.keys(filteredBest3).length > 0)
      dataToUpdate.myBest3 = filteredBest3;
    if (filteredKnowmore.length > 0) dataToUpdate.myKnowmore = filteredKnowmore;
    if (onePhrase !== "") dataToUpdate.myonephrase = onePhrase;
    await setDoc(
      doc(db, "orgs", orgIdStr, "members", now.email),
      dataToUpdate,
      { merge: true }
    );

    console.log("保存しました:", {
      myFavorites: filteredFavorites,
      myIf: filteredIf,
      myBest3: filteredBest3,
      myKnowmore: filteredKnowmore,
      myonephrase: onePhrase,
    });
  };
  //保存用関数
  useEffect(() => {
    if (triggerSave) {
      saveProfile();
    }
  }, [triggerSave]);

  useEffect(() => {
    const fetchHobbys = async () => {
      try {
        const orgIdStr = Array.isArray(orgId) ? orgId[0] : orgId;
        const orgRef = doc(db, "orgs", orgIdStr);
        const orgSnap = await getDoc(orgRef);
        const data = orgSnap.data();
        if (data?.hobbys && Array.isArray(data.hobbys)) {
          setAvailableHobbys(data.hobbys);
        }
      } catch (e) {
        console.error("🔥 趣味の取得失敗:", e);
      }
    };
    fetchHobbys();
  }, [orgId]);
  const saveProfile = async () => {
    try {
      const memberRef = doc(db, "orgs", orgIdStr, "members", now.email);

      const dataToUpdate: { [key: string]: any } = {};

      if (birthday && birthday.trim() !== "") dataToUpdate.birthday = birthday;
      if (zodiac && zodiac.trim() !== "") dataToUpdate.zodiac = zodiac;
      if (hometown && hometown.trim() !== "") dataToUpdate.hometown = hometown;
      if (mbti && mbti.trim() !== "") dataToUpdate.mbti = mbti;
      if (bloodType && bloodType.trim() !== "")
        dataToUpdate.bloodType = bloodType;
      if (hobby && Array.isArray(hobby) && hobby.length > 0)
        dataToUpdate.hobby = hobby;

      if (Object.keys(dataToUpdate).length > 0) {
        await updateDoc(memberRef, dataToUpdate);
        console.log("✅ Firestore に保存完了:", dataToUpdate);
      } else {
        console.log("⚠️ 保存すべきデータがありません。");
      }

      onSaveComplete(); // 親に完了通知
    } catch (error) {
      console.error("❌ 保存失敗:", error);
    }
  };
  useEffect(() => {
    setImageUri(require("../../assets/images/testicon.png"));
  }, []);
  useEffect(() => {
    const orgIdStr = Array.isArray(orgId) ? orgId[0] : orgId;
    const q = query(collection(db, "orgs", orgIdStr, "members"));
    onSnapshot(q, (snapshot) => {
      const list = new Set<string>();
      snapshot.forEach((doc) => {
        const c = doc.data().hometown;
        if (c) list.add(c);
      });
      setCountries(Array.from(list));
    });
  }, []);

  useEffect(() => {
    const newDateStr = `${selectedMonth}月${selectedDay}日`;
    setBirthday(newDateStr || birthday);
    const date = new Date(2000, selectedMonth - 1, selectedDay);
    setZodiac(getZodiacFromDate(date));
  }, [selectedMonth, selectedDay]);

  return (
    <View style={styles.container}>
      <UploadIcon email={now.email} org={orgIdStr} />

      <View style={styles.formSection}>
        <View style={styles.fieldRow}>
          <Text style={styles.label}>名前</Text>
          <Text style={{ flex: 1, color: "#333", paddingVertical: 4 }}>
            {now.name}
          </Text>
        </View>

        {isEditingBirthday ? (
          <>
            <View style={styles.pickerRow}>
              <Picker
                selectedValue={selectedMonth}
                style={{ flex: 1 }}
                onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              >
                {[...Array(12)].map((_, i) => (
                  <Picker.Item key={i + 1} label={`${i + 1}月`} value={i + 1} />
                ))}
              </Picker>
              <Picker
                selectedValue={selectedDay}
                style={{ flex: 1 }}
                onValueChange={(itemValue) => setSelectedDay(itemValue)}
              >
                {[...Array(31)].map((_, i) => (
                  <Picker.Item key={i + 1} label={`${i + 1}日`} value={i + 1} />
                ))}
              </Picker>
            </View>
            <Button
              title="保存"
              onPress={async () => {
                setBirthday(birthday); // 画面上にも反映
                setEditingBirthday(false);
              }}
            />
          </>
        ) : (
          <View style={styles.fieldRow}>
            <Text style={styles.label}>誕生日</Text>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => {
                setEditingBirthday(true);
              }}
            >
              <Text
                style={{
                  paddingVertical: 4,
                  color: "#333",
                  textDecorationLine: "underline",
                }}
              >
                {birthday}
              </Text>
            </Pressable>
          </View>
        )}
        <View style={styles.fieldRow}>
          <Text style={styles.label}>星座</Text>
          <Text style={{ flex: 1, color: "#333", paddingVertical: 4 }}>
            {zodiac}
          </Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.label}>出身国</Text>
          <View style={{ flex: 1 }}>
            {isEditinghometown ? (
              <>
                <Picker
                  selectedValue={hometown || "その他"}
                  onValueChange={handlehometownChange}
                >
                  {uniqueCountries.map((c) => (
                    <Picker.Item key={c} label={c} value={c} />
                  ))}
                  <Picker.Item label="その他（手入力）" value="その他" />
                </Picker>
                {hometown === "" && (
                  <TextInput
                    placeholder="国名を入力"
                    style={styles.input}
                    value={customhometown}
                    onChangeText={setCustomhometown}
                  />
                )}
                <Button
                  title="保存"
                  onPress={async () => {
                    // Firestore保存処理など
                    sethometown(customhometown || hometown); // 画面上にも反映
                    setEditinghometown(false);
                  }}
                />
              </>
            ) : (
              <Pressable
                style={{ flex: 1 }}
                onPress={() => {
                  setEditinghometown(true);
                }}
              >
                <Text
                  style={{
                    paddingVertical: 4,
                    color: "#333",
                    textDecorationLine: "underline",
                  }}
                >
                  {hometown}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.fieldRow]}>
          <Text style={styles.label}>mbti</Text>
          <View style={{ flex: 1, flexDirection: "row" }}>
            {isEditingMbti ? (
              <>
                <Field
                  // label=""
                  value={mbti}
                  onChange={(text) => setMbti(text.toUpperCase())}
                />
                <Button
                  title="保存"
                  onPress={() => {
                    const upperMbti = mbti.toUpperCase();

                    if (upperMbti.length !== 4) {
                      alert("MBTIは必ず4文字で入力してください");
                      return;
                    }

                    // 正常なら保存処理へ
                    setMbti(upperMbti);
                    setEditingMbti(false);

                    // ここに Firestore 保存処理など追加してOK
                  }}
                />
              </>
            ) : (
              <Pressable
                style={{ flex: 1 }}
                onPress={() => {
                  setEditingMbti(true);
                }}
              >
                <Text
                  style={{
                    paddingVertical: 4,
                    color: "#333",
                    textDecorationLine: "underline",
                  }}
                >
                  {mbti}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>血液型</Text>
          <View style={{ flex: 1 }}>
            {isEditingBlood ? (
              <>
                <Picker
                  selectedValue={bloodType}
                  onValueChange={(val) => setBloodType(val)}
                >
                  {bloodOptions.map((opt) => (
                    <Picker.Item label={opt} value={opt} key={opt} />
                  ))}
                </Picker>
                <Button
                  title="保存"
                  onPress={async () => {
                    setBloodType(bloodType); // 画面上にも反映
                    setEditingBlood(false);
                  }}
                />
              </>
            ) : (
              <Pressable
                style={{ flex: 1 }}
                onPress={() => {
                  setEditingBlood(true);
                }}
              >
                <Text
                  style={{
                    paddingVertical: 4,
                    color: "#333",
                    textDecorationLine: "underline",
                  }}
                >
                  {bloodType}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>趣味</Text>
          <View style={{ flex: 1 }}>
            {isEditingHobby ? (
              <>
                <Text style={[styles.label, { width: "100%" }]}>
                  趣味（最大3つ）
                </Text>
                {availableHobbys.map((item) => {
                  const isChecked = hobby.includes(item);
                  const disabled = !isChecked && hobby.length >= 3;

                  return (
                    <TouchableOpacity
                      key={item}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        opacity: disabled ? 0.5 : 1,
                        marginVertical: 4,
                      }}
                      onPress={() => {
                        if (isChecked) {
                          sethobby((prev) => prev.filter((h) => h !== item));
                        } else if (!disabled) {
                          sethobby((prev) => [...prev, item]);
                        }
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderWidth: 1,
                          borderColor: "#333",
                          backgroundColor: isChecked ? "grey" : "#fff",
                          marginRight: 8,
                        }}
                      />
                      <Text>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
                <Button
                  title="保存"
                  onPress={async () => {
                    sethobby(hobby); // 画面上にも反映
                    setEditingHobby(false);
                  }}
                />
              </>
            ) : (
              <Pressable
                style={{ flex: 1 }}
                onPress={() => {
                  setEditingHobby(true);
                }}
              >
                <Text
                  style={{
                    paddingVertical: 4,
                    color: "#333",
                    textDecorationLine: "underline",
                  }}
                >
                  {Array.isArray(hobby) && hobby.length > 0
                    ? hobby.join(" 、 ")
                    : "未入力"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
      <Pressable
        style={{ flexDirection: "row" }}
        onPress={() => {
          if (isEditingCustomize) {
            setEditingCustomize(false);
            handleSave();
          } else {
            setEditingCustomize(true);
          }
        }}
      >
        <Text
          style={{
            fontSize: 20,
            marginTop: 30,
            marginLeft: 40,
            paddingVertical: 5,
            paddingHorizontal: 20,
            fontFamily: "ZenMaru",
            borderColor: "#002AB3",
            borderWidth: 2,
            borderRadius: 20,
          }}
        >
          カスタマイズ項目追加
        </Text>
      </Pressable>

      {isEditingCustomize && (
        <View
          style={{
            position: "absolute",
            borderRadius: 30,
            padding: 30,
            top: -50,
            left: 3,
            width: "110%",
            height: "120%",
            zIndex: 3,
            backgroundColor: "#ffd581",
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              style={{
                alignSelf: "center",
                borderRadius: 29,
                width: 100,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 5,
                borderColor: "#002ab3",
                borderWidth: 1,
                marginVertical: 30,
              }}
              onPress={() => {
                setEditingCustomize(false);
              }}
            >
              <Text
                style={[
                  styles.label,
                  {
                    textAlign: "center",
                    alignItems: "center",
                    color: "#002ab3",
                  },
                ]}
              >
                戻る
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                alignSelf: "center",
                borderRadius: 29,
                width: 100,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 5,
                backgroundColor: "#002Ab3",
                marginVertical: 30,
              }}
              onPress={() => {
                handleSave(), setEditingCustomize(false);
              }}
            >
              <Text
                style={[
                  styles.label,
                  {
                    textAlign: "center",
                    alignItems: "center",
                    color: "white",
                  },
                ]}
              >
                保存
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {customize.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleToggle(item.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 6,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 1,
                    borderColor: "#555",
                    marginRight: 8,
                    backgroundColor: selectedFavors[item.id] ? "#333" : "white",
                  }}
                />
                <Text>{item.name}</Text>
              </TouchableOpacity>
            ))}
            {customize
              .filter((item) => selectedFavors[item.id]) // 選ばれたものだけ表示
              .map((item) => (
                <View key={item.id}>
                  <Text
                    style={{
                      color: "#333",
                      fontWeight: "bold",
                      marginVertical: 5,
                    }}
                  >
                    {item.name}
                  </Text>

                  {/* 中身の表示：id + name の形 */}
                  {item.id === "myFavorites" &&
                    myFavorites.map((fav) => (
                      <View
                        key={fav.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ marginRight: 6 }}>{fav.name}：</Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                            flex: 1,
                          }}
                          value={userFavorites[fav.id]}
                          onChangeText={(text) =>
                            setUserFavorites((prev) => ({
                              ...prev,
                              [fav.id]: text,
                            }))
                          }
                          placeholder="入力してください"
                        />
                      </View>
                    ))}

                  {item.id === "myIf" &&
                    myIf.map((q) => (
                      <View
                        key={q.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ marginRight: 6, flex: 1 }}>
                          {q.name}：
                        </Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                            flex: 2,
                          }}
                          value={userIf[q.id] || ""}
                          onChangeText={(text) =>
                            setUserIf((prev) => ({
                              ...prev,
                              [q.id]: text,
                            }))
                          }
                          placeholder="回答を入力"
                        />
                      </View>
                    ))}
                  {item.id === "myBest3" && (
                    <>
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontWeight: "bold" }}>タイトル：</Text>
                        <TextInput
                          style={styles.input}
                          value={userBest3.title}
                          onChangeText={(text) =>
                            setUserBest3((prev) => ({ ...prev, title: text }))
                          }
                          placeholder="タイトルを入力"
                        />
                      </View>
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontWeight: "bold" }}>1位：</Text>
                        <TextInput
                          style={styles.input}
                          value={userBest3.first}
                          onChangeText={(text) =>
                            setUserBest3((prev) => ({ ...prev, first: text }))
                          }
                          placeholder="1位を入力"
                        />
                      </View>
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontWeight: "bold" }}>2位：</Text>
                        <TextInput
                          style={styles.input}
                          value={userBest3.second}
                          onChangeText={(text) =>
                            setUserBest3((prev) => ({ ...prev, second: text }))
                          }
                          placeholder="2位を入力"
                        />
                      </View>
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontWeight: "bold" }}>3位：</Text>
                        <TextInput
                          style={styles.input}
                          value={userBest3.third}
                          onChangeText={(text) =>
                            setUserBest3((prev) => ({ ...prev, third: text }))
                          }
                          placeholder="3位を入力"
                        />
                      </View>
                    </>
                  )}

                  {item.id === "myKnowmore" &&
                    userKnowmore.map((entry, index) => (
                      <View
                        key={entry.id}
                        style={{
                          borderWidth: 1,
                          borderColor: "#ccc",
                          borderRadius: 8,
                          padding: 10,
                          marginBottom: 10,
                        }}
                      >
                        <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                          No.{entry.id}
                        </Text>

                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: "#aaa",
                            padding: 6,
                            borderRadius: 4,
                            marginBottom: 6,
                          }}
                          placeholder="タイトルを入力"
                          value={entry.name}
                          onChangeText={(text) => {
                            const newKnowmore = [...userKnowmore];
                            newKnowmore[index].name = text;
                            setUserKnowmore(newKnowmore);
                          }}
                        />

                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: "#aaa",
                            padding: 6,
                            borderRadius: 4,
                          }}
                          placeholder="回答を入力"
                          value={entry.answer}
                          onChangeText={(text) => {
                            const newKnowmore = [...userKnowmore];
                            newKnowmore[index].answer = text;
                            setUserKnowmore(newKnowmore);
                          }}
                        />

                        <TouchableOpacity
                          onPress={() => {
                            const newKnowmore = [...userKnowmore];
                            newKnowmore.splice(index, 1);
                            // id を振り直す
                            const renumbered = newKnowmore.map((item, i) => ({
                              ...item,
                              id: String(i),
                            }));
                            setUserKnowmore(renumbered);
                          }}
                          style={{
                            marginTop: 8,
                            alignSelf: "flex-end",
                          }}
                        >
                          <Text style={{ color: "red" }}>削除</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                  {/* 追加ボタン */}
                  {item.id === "myKnowmore" && (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          setUserKnowmore((prev) => [
                            ...prev,
                            {
                              id: String(prev.length),
                              name: "",
                              answer: "",
                            },
                          ]);
                        }}
                        style={{
                          backgroundColor: "#ddd",
                          padding: 8,
                          borderRadius: 6,
                          alignSelf: "flex-start",
                          marginTop: 10,
                        }}
                      >
                        <Text>＋ 新しく追加</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {item.id === "myonephrase" && userOnePhrase.trim() !== "" && (
                    <View style={{ marginTop: 8 }}>
                      {/* <Text style={{ marginBottom: 4, fontWeight: "bold" }}>
                      ひとこと
                    </Text> */}
                      <TextInput
                        multiline
                        numberOfLines={3}
                        placeholder="例：みんなともっと仲良くなりたい！"
                        value={userOnePhrase}
                        onChangeText={setUserOnePhrase}
                        style={{
                          borderWidth: 1,
                          borderColor: "#ccc",
                          padding: 8,
                          borderRadius: 4,
                          textAlignVertical: "top", // Androidで上から始まるように
                        }}
                      />
                    </View>
                  )}
                </View>
              ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

function Field({
  // label,
  value,
  onChange,
}: {
  // label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldRow}>
      {/* <Text style={styles.label}>{label}</Text> */}
      <TextInput
        style={[styles.input, { flex: 0 }]}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    paddingHorizontal: 20,

    paddingBottom: 60,
  },
  header: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  saveText: {
    color: "#333",
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  imageRing: {
    borderWidth: 3,
    borderRadius: 75,
    padding: 3,
  },
  image: { width: 151, height: 184 },
  changePhoto: {
    marginTop: 10,
    color: "#555",
    textAlign: "center",
  },
  formSection: {
    marginTop: 10,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    width: 80,
    color: "#333",
    fontWeight: "bold",
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    flex: 1,
    paddingVertical: 4,
  },
  imageWrapper: {
    width: 151,
    height: 183,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  ringOverlay: {
    position: "absolute",
    width: 151,
    height: 151,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#ffffff", // ここを ringColor にしてもOK
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
});
export default EditProfile;
