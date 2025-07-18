import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export type OrgCandidate = { orgId: string; role: string; name: string };

export const useOrgCandidates = (email: string | null) => {
  const [orgCandidates, setOrgCandidates] = useState<OrgCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    const fetchOrgs = async () => {
      const matches: OrgCandidate[] = [];
      const orgsSnap = await getDocs(collection(db, "orgs"));

      for (const orgDoc of orgsSnap.docs) {
        const memRef = doc(db, "orgs", orgDoc.id, "members", email);
        const memSnap = await getDoc(memRef);
        if (memSnap.exists()) {
          const orgData = orgDoc.data();
          matches.push({
            orgId: orgDoc.id,
            role: memSnap.data().role,
            name: orgData.name,
          });
        }
      }

      setOrgCandidates(matches);
      setLoading(false);
    };

    fetchOrgs();
  }, [email]);

  return { orgCandidates, loading };
};
