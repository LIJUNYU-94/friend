// 友達数・属性進捗計算用の関数
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const MBTI_LIST = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

export async function getCollectionProgress(orgId: string, myEmail: string) {
  const membersSnap = await getDocs(collection(db, "orgs", orgId, "members"));

  const connected: any[] = [];
  const allMembers: any[] = [];

  membersSnap.forEach((doc) => {
    if (doc.id === myEmail) return; // ← 自分はスキップ
    const data = doc.data();
    allMembers.push(data);

    if (
      data.connections &&
      data.connections[myEmail.replace(/\./g, "__")] === "connected"
    ) {
      connected.push(data);
    }
  });

  // 友達進捗
  const friendsProgress = connected.length;
  const friendsTotal = allMembers.length;

  // 誕生日（重複無しの月）
  const allBirthMonths = new Set(
    allMembers
      .map((m) => m.birthday)
      .filter(Boolean)
      .map((b: string) => b.split("月")[0])
  );

  const connectedBirthMonths = new Set(
    connected
      .map((m) => m.birthday)
      .filter(Boolean)
      .map((b: string) => b.split("月")[0])
  );

  // 星座
  const allZodiac = new Set(allMembers.map((m) => m.zodiac).filter(Boolean));
  const connectedZodiac = new Set(
    connected.map((m) => m.zodiac).filter(Boolean)
  );

  // mbti（16種類のみ対象）
  const allMbti = new Set(
    allMembers.map((m) => m.mbti).filter((mbti) => MBTI_LIST.includes(mbti))
  );
  const connectedMbti = new Set(
    connected.map((m) => m.mbti).filter((mbti) => MBTI_LIST.includes(mbti))
  );

  // 血液型
  const allBlood = new Set(allMembers.map((m) => m.bloodType).filter(Boolean));
  const connectedBlood = new Set(
    connected.map((m) => m.bloodType).filter(Boolean)
  );

  // 出身国
  const allCountry = new Set(allMembers.map((m) => m.hometown).filter(Boolean));
  const connectedCountry = new Set(
    connected.map((m) => m.hometown).filter(Boolean)
  );

  return [
    {
      name: "友達",
      current: friendsProgress,
      total: friendsTotal,
      per: friendsProgress / friendsTotal,
    },
    {
      name: "誕生日",
      current: connectedBirthMonths.size,
      total: allBirthMonths.size,
      per: connectedBirthMonths.size / allBirthMonths.size,
    },
    {
      name: "星座",
      current: connectedZodiac.size,
      total: allZodiac.size,
      per: connectedZodiac.size / allZodiac.size,
    },
    {
      name: "mbti",
      current: connectedMbti.size,
      total: allMbti.size,
      per: connectedMbti.size / allMbti.size,
    },
    {
      name: "血液型",
      current: connectedBlood.size,
      total: allBlood.size,
      per: connectedBlood.size / allBlood.size,
    },
    {
      name: "出身国",
      current: connectedCountry.size,
      total: allCountry.size,
      per: connectedCountry.size / allCountry.size,
    },
  ];
}
