import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signOut,
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

// Calls back with the persisted user (or null) on load and on every auth change.
// Returns the unsubscribe function.
export function watchAuthState(auth, callback) {
  return onAuthStateChanged(auth, callback);
}

export function signOutEmail(auth) {
  return signOut(auth);
}
