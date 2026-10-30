import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Next.js only inlines NEXT_PUBLIC_* vars when referenced literally,
// so each one has to be spelled out here.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value && key !== "measurementId")
  .map(([key]) => key);
if (missing.length) {
  throw new Error(
    `Missing Firebase env vars: ${missing.join(", ")}. See .env.example.`,
  );
}

// Reuse the existing app on hot reload instead of initializing twice
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Analytics needs a browser, so it can't run during SSR
export const getAnalyticsInstance = async () =>
  typeof window !== "undefined" && (await isSupported())
    ? getAnalytics(app)
    : null;
