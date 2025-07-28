// app/pages/collection.tsx
import { batches } from "@/components/my-components/batches";
import { getCollectionProgress } from "@/components/my-components/getCollectionProgress";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ProgressBar } from "react-native-paper";
import PieChart from "react-native-pie-chart";

type Props = { per: number };
function ProgressCircle({ per }: Props) {
  const widthAndHeight = 100;
  const series = [
    { value: per, color: "#FFD180" },
    { value: 100 - per, color: "#FFF1D0" },
  ];

  return (
    <View style={styles.circle}>
      <PieChart widthAndHeight={widthAndHeight} series={series} />
    </View>
  );
}
export default function Collection() {
  const { orgId, myEmail } = useLocalSearchParams<{
    orgId: string;
    myEmail: string;
  }>();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const data = await getCollectionProgress(orgId, myEmail);
      setCategories(data);
      setLoading(false);
    };

    fetchProgress();
  }, [orgId, myEmail]);

  if (loading) {
    return <Text>読み込み中...</Text>;
  }
  // 関数の先頭に追加

  const overallProgress = Math.round(
    (categories.reduce((sum, c) => sum + c.current, 0) /
      categories.reduce((sum, c) => sum + c.total, 0)) *
      100
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 戻るボタン */}
      <View style={styles.top}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>

        <View style={styles.batches}>
          {batches.map((batch, index) => (
            <Image
              key={index}
              source={
                categories[index].per < 0.5
                  ? batch.icon
                  : categories[index].per < 0.75
                  ? batch.icon50
                  : categories[index].per < 1
                  ? batch.icon70
                  : batch.icon100
              }
              style={styles.batch}
              resizeMode="contain"
            />
          ))}
        </View>
      </View>
      {/* 全体進捗 */}
      <View style={styles.overallContainer}>
        <View>
          <Text style={styles.overallTitle}>全体的な進捗状況</Text>
          <Text style={styles.overallPercent}>{overallProgress} %</Text>
        </View>
        <ProgressCircle per={overallProgress} />
      </View>

      {/* 項目ごとの進捗 */}
      {categories.map((item, index) => {
        const progress = item.current / item.total;
        return (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <ProgressBar
              progress={progress}
              color="#002AB3"
              style={styles.progressBar}
            />
            <Text style={styles.count}>
              {item.current}/{item.total}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF4E2",
    padding: 10,
    paddingTop: 80,
    alignItems: "center",
  },
  backButton: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#80590C",
    borderWidth: 1,
    borderRadius: 30,
    width: "28%",
    height: 30,
  },
  backText: {
    color: "#80590C",
    fontSize: 16,
    fontFamily: "ZenMaru",
  },
  overallContainer: {
    backgroundColor: "white",
    borderRadius: 30,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  overallTitle: {
    fontSize: 16,
    fontFamily: "ZenMaru",
    color: "#80590C",
    marginBottom: 10,
  },
  overallPercent: {
    fontSize: 48,
    fontFamily: "ZenMaru",
    color: "#80590C",
    fontWeight: "bold",
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 66,
    backgroundColor: "#FFEBC2",
    marginTop: 10,
  },
  card: {
    backgroundColor: "#fff",

    borderRadius: 16,
    padding: 15,
    width: "90%",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "ZenMaru",
    color: "#80590C",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 5,
    backgroundColor: "#ccc",
  },
  count: {
    textAlign: "right",
    color: "#80590C",
    marginTop: 8,
    fontFamily: "ZenMaru",
    fontSize: 16,
  },
  batches: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  batch: {
    width: 28,
    height: 28,
    marginHorizontal: 5,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
  },
});
