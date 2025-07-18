import { db } from "@/lib/firebase"; // あなたのfirebase設定
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const cloudName = "dnhxclw2b";
const uploadPreset = "friend_icon";

export default function UploadIcon({
  email,
  org,
}: {
  email: string;
  org: string;
}) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  // 初期表示時、Firestoreからアイコンを取得
  useEffect(() => {
    const fetchIcon = async () => {
      if (email === "1") {
        // 組織アイコンを取得
        const orgRef = doc(db, "orgs", org);
        const snap = await getDoc(orgRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.imageUrl) {
            setImageUri(data.imageUrl);
          }
        }
      } else {
        // メンバーアイコンを取得
        const userRef = doc(db, "orgs", org, "members", email);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.icon) {
            setImageUri(data.icon);
          }
        }
      }
    };

    fetchIcon();
  }, [email, org]);
  // 画像選択
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await uploadToCloudinary(uri);
    }
  };

  // Cloudinaryアップロード
  const uploadToCloudinary = async (uri: string) => {
    const formData = new FormData();

    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: "profile.jpg",
    } as any);

    formData.append("upload_preset", uploadPreset);

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const url = res.data.secure_url;
    setUploadedUrl(url);
    await saveUrlToFirebase(url);
  };

  // Firebase保存
  const saveUrlToFirebase = async (url: string) => {
    if (email === "1") {
      // orgのアイコンを更新
      const orgRef = doc(db, "orgs", org);
      await updateDoc(orgRef, {
        imageUrl: url,
      });
      console.log("✅ 組織アイコン保存完了");
    } else {
      // メンバーのアイコンを更新
      const userRef = doc(db, "orgs", org, "members", email);
      await updateDoc(userRef, {
        icon: url,
      });
      console.log("✅ メンバーアイコン保存完了");
    }
  };

  return (
    <View style={email !== "1" && styles.imageContainer}>
      <Pressable onPress={pickImage}>
        {email === "1" ? (
          <Image
            source={
              imageUri
                ? { uri: imageUri }
                : require("../../assets/images/classroom.png")
            }
            style={styles.imageHeader}
          />
        ) : (
          <>
            <View style={styles.imageWrapper}>
              <Image
                source={
                  imageUri
                    ? { uri: imageUri }
                    : require("../../assets/images/testicons.png")
                }
                style={styles.image}
              />
              <View style={styles.ringOverlay} />
            </View>
            <Text style={styles.changePhoto}>写真を変更</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
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
  imageHeader: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
    marginTop: 40,
  },
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
