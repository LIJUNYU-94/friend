import ProfileField from "@/components/my-components/profileField";
import UploadIcon from "@/components/my-components/uploadToCloudinary";
import { db } from "@/lib/firebase";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
export default function OrgProfile() {
  //   const orgData = {
  //     name: "Webデザイン科",
  //     adminName: "関根 慎二",
  //     adminRole: "先生",
  //     created: "いつだっけ",
  //     location: "東京都新宿区百人町",
  //     message:
  //       "このアプリでクラスの仲間を知りましょう。\n課題や授業は忙しいですが、頑張りましょう。",
  //     imageUrl: require("../../assets/images/classroom.png"),
  //   };
  const { orgId, role } = useLocalSearchParams<{
    orgId: string;
    role: string;
  }>();
  const [orgData, setOrgData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    const fetchOrg = async () => {
      if (!orgId) return;
      const orgRef = doc(db, "orgs", orgId);
      const orgSnap = await getDoc(orgRef);
      if (orgSnap.exists()) {
        setOrgData(orgSnap.data());
      }
    };
    fetchOrg();
  }, [orgId]);
  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    const orgRef = doc(db, "orgs", orgId);
    await updateDoc(orgRef, orgData);
    setSaving(false);
  };
  if (!orgData) {
    return <Text>読み込み中...</Text>;
  }
  return (
    <ScrollView style={styles.container}>
      <View
        style={{
          backgroundColor: "#ffebc2",
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
        }}
      >
        {isEditing ? (
          <UploadIcon email={"1"} org={orgId} />
        ) : (
          <Image
            source={
              orgData.imageUrl
                ? { uri: orgData.imageUrl }
                : require("../../assets/images/classroom.png")
            }
            style={styles.image}
          />
        )}

        <View style={styles.inner}>
          <Text style={styles.sectionTitle}>組織名</Text>
          <Text style={styles.orgName}>{orgData.name}</Text>

          <Text style={styles.sectionTitle}>基本情報</Text>

          <ProfileField label="管理者名前">
            {isEditing ? (
              <TextInput
                style={styles.contentText}
                value={orgData.adminName}
                onChangeText={(text) =>
                  setOrgData({ ...orgData, adminName: text })
                }
                placeholder="名前未入力"
              />
            ) : (
              <Text style={styles.contentText}>
                {orgData.adminName || "名前未入力"}
              </Text>
            )}
          </ProfileField>

          <ProfileField label="管理者の役割">
            {isEditing ? (
              <TextInput
                style={styles.contentText}
                value={orgData.adminRole}
                onChangeText={(text) =>
                  setOrgData({ ...orgData, adminRole: text })
                }
                placeholder="役割未入力"
              />
            ) : (
              <Text style={styles.contentText}>
                {orgData.adminRole || "役割未入力"}
              </Text>
            )}
          </ProfileField>

          <ProfileField label="創設日">
            {isEditing ? (
              <TextInput
                style={styles.contentText}
                value={orgData.created}
                onChangeText={(text) =>
                  setOrgData({ ...orgData, created: text })
                }
                placeholder="創設日未入力"
              />
            ) : (
              <Text style={styles.contentText}>
                {orgData.created || "創設日未入力"}
              </Text>
            )}
          </ProfileField>

          <ProfileField label="所在地">
            {isEditing ? (
              <TextInput
                style={styles.contentText}
                value={orgData.location}
                onChangeText={(text) =>
                  setOrgData({ ...orgData, location: text })
                }
                placeholder="所在地未入力"
              />
            ) : (
              <Text style={styles.contentText}>
                {orgData.location || "所在地未入力"}
              </Text>
            )}
          </ProfileField>

          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>組織メンバーへのメッセージ</Text>
            {isEditing ? (
              <TextInput
                style={styles.messageText}
                multiline
                value={orgData.message}
                onChangeText={(text) =>
                  setOrgData({ ...orgData, message: text })
                }
                placeholder="メッセージ未入力"
              />
            ) : (
              <Text style={styles.messageText}>
                {orgData.message || "メッセージ未入力"}
              </Text>
            )}
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "center", gap: 20 }}
          >
            {role === "admin" && (
              <>
                {isEditing ? (
                  <TouchableOpacity
                    onPress={async () => {
                      await handleSave();
                      setIsEditing(false);
                      router.replace({
                        pathname: "/pages/orgprofile",
                        params: { orgId, role },
                      });
                    }}
                    disabled={saving}
                    style={styles.backBtn}
                  >
                    <Text style={styles.backBtnText}>保存</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditing(true);
                    }}
                    disabled={saving}
                    style={styles.backBtn}
                  >
                    <Text style={styles.backBtnText}>編集</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>戻る</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF4E2",
    paddingTop: 40,
  },
  pageTitle: {
    color: "#aaa",
    margin: 8,
    fontSize: 14,
  },
  image: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
    marginTop: 40,
  },
  inner: {
    padding: 20,
    marginHorizontal: 20,
  },
  sectionTitle: {
    color: "#80590C",
    fontSize: 14,
    marginBottom: 4,
  },
  orgName: {
    fontSize: 20,
    width: "100%",
    textAlign: "center",
    color: "#80590C",
    marginBottom: 24,
    marginTop: 6,
  },
  contentText: {
    fontSize: 20,
    color: "#80590C",
  },
  messageBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  messageLabel: {
    fontSize: 10,
    color: "#80590C",
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    padding: 30,
    color: "#80590C",
    lineHeight: 18.2,
  },
  backBtn: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  backBtnText: {
    color: "#333",
  },
});
