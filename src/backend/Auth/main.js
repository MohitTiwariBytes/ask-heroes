import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signOut,
  signInWithPopup,
} from "firebase/auth";

export async function signUpEmail(auth, email, password) {
  // Keep the user signed in across reloads and browser restarts until they sign out
  await setPersistence(auth, browserLocalPersistence);
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return userCredential.user;
}

export async function signInEmail(auth, email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function watchAuthState(auth, callback) {
  return onAuthStateChanged(auth, callback);
}

export function signUserOut(auth) {
  return signOut(auth);
}

export function googleSignIn(auth, provider) {
  return signInWithPopup(auth, provider);
}
