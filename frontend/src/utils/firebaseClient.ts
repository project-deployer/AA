import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import { firebaseConfig, isFirebaseConfigured } from "../config/firebase";

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

export function initFirebase() {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = initializeApp(firebaseConfig as any);
    auth = getAuth(app);
  }
  return { app, auth };
}

export function ensureRecaptcha(containerId = "recaptcha-container") {
  if (!auth) initFirebase();
  if (!auth) throw new Error("Firebase not initialized");
  // @ts-ignore
  if (!(window as any).recaptchaVerifier) {
    // Invisible reCAPTCHA
    (window as any).recaptchaVerifier = new RecaptchaVerifier(
      containerId,
      { size: "invisible" },
      auth as ReturnType<typeof getAuth>
    );
  }
  return (window as any).recaptchaVerifier as RecaptchaVerifier;
}

export async function sendOtp(phone: string) {
  if (!auth) initFirebase();
  if (!auth) throw new Error("Firebase not initialized");
  const verifier = ensureRecaptcha();
  return signInWithPhoneNumber(auth as ReturnType<typeof getAuth>, phone, verifier);
}

export async function signInWithGoogle() {
  if (!auth) initFirebase();
  if (!auth) throw new Error("Firebase not initialized");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth as ReturnType<typeof getAuth>, provider);
}

export async function getIdToken(user: User) {
  return user.getIdToken();
}
