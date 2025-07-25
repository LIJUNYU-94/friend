import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
export default function Guide() {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      router.replace("/"); // 最後はHOMEやTOPへ遷移
    }
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.skip}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.skiptext}>スキップ</Text>
        </TouchableOpacity>
        <View style={styles.imagecontainer}>
          {step === 0 && (
            <>
              <Text style={[styles.imagetext, { fontSize: 32, top: 170 }]}>
                友達コネクションへ{"\n"}ようこそ
              </Text>

              <Image
                source={require("../../assets/images/start1.png")}
                style={{ width: 247, resizeMode: "contain" }}
              />
            </>
          )}
          {step === 1 && (
            <>
              <Text
                style={[
                  styles.imagetext,
                  { fontSize: 16, bottom: 30, flexShrink: 1 },
                ]}
              >
                まずは自分のプロフィールを入力しよう
              </Text>
              <Image
                source={require("../../assets/images/start2.png")}
                style={{ width: 195, resizeMode: "contain" }}
              />
            </>
          )}
          {step === 2 && (
            <View style={{ width: 350, height: 350 }}>
              <Text
                style={[styles.imagetext, { fontSize: 16, top: 280, left: 30 }]}
              >
                顔と名前が覚えられる！
              </Text>
              <Image
                source={require("../../assets/images/start3-1.png")}
                style={{
                  width: 235,
                  resizeMode: "contain",
                  position: "absolute",
                  top: 0,
                }}
              />
              <Image
                source={require("../../assets/images/start3-2.png")}
                style={{
                  width: 34,
                  resizeMode: "contain",
                  position: "absolute",
                  top: 200,
                  left: 120,
                }}
              />
              <Image
                source={require("../../assets/images/start3-3.png")}
                style={{
                  width: 119,
                  resizeMode: "contain",
                  position: "absolute",
                  top: 200,
                  right: 20,
                }}
              />
            </View>
          )}
          {step === 3 && (
            <>
              <Text
                style={[
                  styles.imagetext,
                  {
                    fontSize: 16,
                    bottom: -70,
                    left: 0,
                    width: "100%",
                  },
                ]}
              >
                友達に話しかけるきっかけができる！
              </Text>
              <Image
                source={require("../../assets/images/start4.png")}
                style={{ width: 438, resizeMode: "contain" }}
              />
            </>
          )}
          {step === 4 && (
            <>
              <Text
                style={[
                  styles.imagetext,
                  { fontSize: 16, bottom: 197, width: "100%" },
                ]}
              >
                コネクション状況もわかる！
              </Text>
              <Image
                source={require("../../assets/images/start5.png")}
                style={{ width: 205, resizeMode: "contain", top: -30 }}
              />
            </>
          )}
        </View>
        <View style={styles.handler}>
          {[0, 1, 2, 3, 4].map((i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setStep(i)}
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: step === i ? "#7A4C00" : "#D9D9D9",
                marginHorizontal: 6,
              }}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.next} onPress={handleNext}>
          <Text style={styles.nexttext}>次へ</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF4E2",
    paddingTop: 100,
    height: "100%",
    flex: 1,
    position: "relative",
    justifyContent: "center",
  },
  skip: {
    position: "absolute",
    right: 40,
    top: 150,
  },
  skiptext: {
    fontSize: 20,
    color: "#B3AEAE",
  },
  imagecontainer: {
    alignSelf: "center",
    position: "absolute",
  },
  imagetext: {
    position: "absolute",
    textAlign: "center",
    color: "#533B08",
    zIndex: 5,
  },
  handler: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    position: "absolute",
    bottom: 193,
    left: "50%",
    transform: [{ translateX: "-50%" }],
  },
  next: {
    width: 317,
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 69,
    borderWidth: 2,
    borderColor: "#80590C",
    position: "absolute",
    bottom: 73,
    left: "50%",
    transform: [{ translateX: "-50%" }],
  },
  nexttext: { fontSize: 20, fontWeight: 700, color: "#80590C" },
});
