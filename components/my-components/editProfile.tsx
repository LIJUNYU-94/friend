import { db } from "@/lib/firebase";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
  Button,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type EditProfileProps = {
  user: any;
  now: any;
  orgId: string | string[];
  triggerSave: boolean;
  onSaveComplete: () => void;
};
const uploadImageAsync = async (uri: string) => {
  const storage = getStorage();

  // blob取得（React Native対応）
  const blob = await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error("blob変換失敗"));
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

  const filename = `profile_${Date.now()}.jpg`;
  const storageRef = ref(storage, `profile_images/${filename}`);

  await uploadBytes(storageRef, blob);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
};
const formatDateToJP = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
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
  const handlehometownChange = (value: string) => {
    if (value === "その他") {
      sethometown(""); // クリア
    } else {
      sethometown(value);
      setCustomhometown("");
    }
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
      const orgIdStr = Array.isArray(orgId) ? orgId[0] : orgId;
      const memberRef = doc(db, "orgs", orgIdStr, "members", now.email);

      await updateDoc(memberRef, {
        birthday,
        zodiac,
        hometown,
        mbti,
        bloodType,
        hobby,
      });
      console.log("✅ Firestore に保存完了");
      console.log(birthday, zodiac, hometown, mbti, bloodType);
      onSaveComplete(); // 親に完了通知
    } catch (error) {
      console.error("❌ 保存失敗:", error);
    }
  };
  useEffect(() => {
    setImageUri(require("../../assets/images/testicons.png"));
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
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Image],
      quality: 0.8,
    });
    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      setImageUri(localUri);
      try {
        const uploadedUrl = await uploadImageAsync(localUri);
        console.log("アップロード成功:", uploadedUrl);
      } catch (err) {
        console.error("アップロード失敗:", err);
      }
    }
  };
  useEffect(() => {
    const newDateStr = `${selectedMonth}月${selectedDay}日`;
    setBirthday(newDateStr || birthday);
    const date = new Date(2000, selectedMonth - 1, selectedDay);
    setZodiac(getZodiacFromDate(date));
  }, [selectedMonth, selectedDay]);
  console.log(availableHobbys);
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Pressable onPress={pickImage}>
          {imageUri && (
            <View style={styles.imageWrapper}>
              <Image
                source={
                  typeof imageUri === "string" ? { uri: imageUri } : imageUri
                }
                style={styles.image}
              />
              <View style={styles.ringOverlay} />
            </View>
          )}
          <Text style={styles.changePhoto}>写真を変更</Text>
        </Pressable>
      </View>

      <View style={styles.formSection}>
        <View style={styles.fieldRow}>
          <Text style={styles.label}>名前</Text>
          <Text style={{ flex: 1, color: "#333", paddingVertical: 4 }}>
            {now.name}
          </Text>
        </View>
        {/* <View style={styles.fieldRow}>
          <Text style={styles.label}>誕生日</Text>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              setShowPicker(true);
              console.log(showPicker);
            }}
          >
            <Text style={{ paddingVertical: 4, color: "#333" }}>
              {birthday}
            </Text>
          </Pressable>
        </View> */}

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
              <Text style={{ paddingVertical: 4, color: "#333" }}>
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
                <Text style={{ paddingVertical: 4, color: "#333" }}>
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
                  label=""
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
                <Text style={{ paddingVertical: 4, color: "#333" }}>
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
                <Text style={{ paddingVertical: 4, color: "#333" }}>
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
                <Text style={{ paddingVertical: 4, color: "#333" }}>
                  {Array.isArray(hobby) && hobby.length > 0
                    ? hobby.join(" 、 ")
                    : "未入力"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} />
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
