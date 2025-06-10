//auth.tsx
import { useGoogleLogin } from "@/components/my-components/useGoogleLogin";
import { useEffect } from "react";
import { Button, Text } from "react-native";
export default function Auth() {
  const { promptAsync } = useGoogleLogin();
  useEffect(() => {
    // クライアントでのみ動かす
    if (typeof window !== "undefined") {
      console.log("Client only");
    }
  }, []);

  return (
    <>
      <Text>UID:773</Text>
      <Button title="Googleでログイン" onPress={() => promptAsync()} />
    </>
  );
}
