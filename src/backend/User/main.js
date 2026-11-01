import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

// Profiles live at users/{uid}

export async function getUserProfile(db, uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export function saveUserProfile(db, user, { name, age }) {
  return setDoc(
    doc(db, "users", user.uid),
    {
      name,
      age,
      email: user.email,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
