import { db } from "@/lib/firebase";
import Checkbox from "expo-checkbox";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HobbySetting() {
  const { orgId, role, email } = useLocalSearchParams<{
    orgId: string;
    role: string;
    email: string;
  }>();
  const [newHobby, setNewHobby] = useState("");
  const [hobbys, setHobbys] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();
  useEffect(() => {
    const fetchHobbys = async () => {
      const orgRef = doc(db, "orgs", orgId);
      const orgSnap = await getDoc(orgRef);
      if (orgSnap.exists()) {
        const data = orgSnap.data();
        console.log(data);
        console.log(hobbys);
        const hobbyValues = data.hobbys as string[]; // ["ファッション", "旅行", ...]
        setHobbys(hobbyValues);
      }
    };
    fetchHobbys();
  }, [orgId]);
  const handleSelect = (name: string) => {
    if (selected.includes(name)) {
      setSelected(selected.filter((item) => item !== name));
    } else {
      if (selected.length >= 3) {
        alert("最大3つまで選択できます");
        return;
      }
      setSelected([...selected, name]);
    }
  };

  const handleSubmit = async () => {
    const userRef = doc(db, "orgs", orgId, "members", email);
    await setDoc(userRef, { hobby: selected }, { merge: true });
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {role === "member"
          ? "ご自身の趣味を選択してください"
          : "趣味の選択肢を設定してください"}
      </Text>

      {hobbys.map((hobby, index) => (
        <View
          key={index}
          style={[
            styles.row,
            index % 2 === 0 && { backgroundColor: "#FFD680" },
          ]}
        >
          {role === "admin" ? (
            <>
              <TouchableOpacity
                onPress={async () => {
                  const newHobbys = hobbys.filter((item) => item !== hobby);
                  setHobbys(newHobbys);
                  const orgRef = doc(db, "orgs", orgId);
                  await setDoc(orgRef, { hobbys: newHobbys }, { merge: true });
                }}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.text}>{hobby}</Text>
            </>
          ) : (
            <>
              <Checkbox
                value={selected.includes(hobby)}
                onValueChange={() => handleSelect(hobby)}
                style={styles.checkbox}
              />
              <Text style={styles.text}>{hobby}</Text>
            </>
          )}
        </View>
      ))}
      {role === "admin" && (
        <View style={styles.row}>
          <TextInput
            placeholder="新しい趣味を追加"
            style={[styles.text, { flex: 1 }]}
            value={newHobby}
            onChangeText={(text) => setNewHobby(text)}
            onSubmitEditing={async () => {
              if (!newHobby.trim()) return;
              const updated = [...hobbys, newHobby.trim()];
              setHobbys(updated);
              setNewHobby("");
              const orgRef = doc(db, "orgs", orgId);
              await setDoc(orgRef, { hobbys: updated }, { merge: true });
            }}
          />
        </View>
      )}
      {selected.length > 0 && role === "member" && (
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>次へ</Text>
        </TouchableOpacity>
      )}
      {role === "admin" && (
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>戻る</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF4E2",
    paddingTop: 100,
    height: "100%",
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    fontFamily: "ZenMaru",
    marginBottom: 20,
    color: "#80590C",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  checkbox: {
    marginRight: 10,
    width: 24,
    height: 24,
    borderColor: "#80590C",
    borderWidth: 2,
  },
  text: {
    fontSize: 18,
    fontFamily: "ZenMaru",
    color: "#80590C",
  },
  notice: {
    textAlign: "center",
    marginTop: 20,
    color: "blue",
    fontSize: 14,
    fontFamily: "ZenMaru",
  },
  button: {
    backgroundColor: "#0056FF",
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
    alignSelf: "center",
    paddingHorizontal: 60,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "ZenMaru",
    letterSpacing: 2,
  },
  deleteBtn: {
    marginLeft: 10,
    backgroundColor: "#30377bff",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 28,
    marginRight: 20,
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "ZenMaru",
  },
});
