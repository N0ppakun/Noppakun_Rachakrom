import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// --- ⬇️ ใส่ Config ของคุณตรงนี้ ⬇️ ---
const firebaseConfig = {
  apiKey: "AIzaSyBKhBr_EBO9PrDtlc58G7PAPwqapAwD5XY",
  authDomain: "minipro-895ad.firebaseapp.com",
  projectId: "minipro-895ad",
  storageBucket: "minipro-895ad.firebasestorage.app",
  messagingSenderId: "142980389805",
  appId: "1:142980389805:web:21b42cb4e8b528fb569f24",
  measurementId: "G-4E2SV6YLXH"
};
// --- ⬆️ สิ้นสุดส่วน Config ⬆️ ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export service ที่คุณจะใช้ในหน้าอื่นๆ
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);

// แนะนำให้ export app ไว้ด้วย เผื่อต้องใช้
export default app;