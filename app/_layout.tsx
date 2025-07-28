//_layout.tsx
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  const [loaded] = useFonts({
    ZenMaru: require("../assets/fonts/ZenMaruGothic-Medium.ttf"),
  });

  if (!loaded) return null;

  return (
    <>
      {/* Use CustomText instead of Text throughout your app */}
      <Stack screenOptions={{ headerShown: false }} />
      {/* <Stack /> */}
      <StatusBar style="auto" />
    </>
  );
}
