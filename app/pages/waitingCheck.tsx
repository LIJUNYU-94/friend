import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WaitingCheckScreen() {
  const { status } = useLocalSearchParams(); // "new" or "wait"
  const [progress, setProgress] = useState(40);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 60 ? prev + 1 : 60));
    }, 100); // 100msごとに1%アップ（約10秒で完了）

    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, []);

  const progressWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["40%", "60%"],
  });

  return (
    <View style={styles.container}>
      {/* プログレスバー */}
      {status !== "new" ? (
        <>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[styles.progressBar, { width: progressWidth }]}
            />
          </View>
          <Text style={styles.percentText}>{progress}%</Text>
          <Text style={styles.mainText}>管理者確認中です…</Text>
          <Text style={styles.subText}>組織審査をお待ちください</Text>
        </>
      ) : (
        <View style={{ justifyContent: "center", gap: 30 }}>
          <Text style={styles.mainText}>
            組織の新規登録、ありがとうございます。
          </Text>
          <Text style={styles.mainText}>
            ただいま管理者による審査を行っています。
          </Text>
          <Text style={styles.mainText}>
            審査が通過次第、メールでご連絡いたします。
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: "/", params: { status: "wait" } })
            } // ← ルートに戻る処理
            style={{
              marginTop: 40,
              paddingVertical: 10,
              paddingHorizontal: 30,
              backgroundColor: "#002ab3",
              borderRadius: 24,
              width: 200,
              alignSelf: "center",
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: 16,
                textAlign: "center",
              }}
            >
              TOPに戻る
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF4E2",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarContainer: {
    width: "60%",
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#4C63D2", // 青
  },
  percentText: {
    fontSize: 14,
    marginBottom: 20,
    color: "#333",
  },
  mainText: {
    fontSize: 18,
    color: "#7B4600",
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: "#7B4600",
  },
  statusLabel: {
    marginTop: 20,
    fontSize: 14,
    color: "#666",
  },
});
