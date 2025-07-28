// components/ProfileField.tsx

import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ProfileField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#fff",
    height: 60,
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    color: "#80590C",
    fontFamily: "ZenMaru",

    padding: 4,
  },
  content: {
    fontSize: 20,
    fontFamily: "ZenMaru",
    marginLeft: 35,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
});
