import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("🔁 Firebase User:", firebaseUser);

      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  return user;
}
