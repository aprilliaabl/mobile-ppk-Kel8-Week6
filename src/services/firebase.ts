/**
 * Inisialisasi Layanan Firebase (Sprint 2 - Kelompok 8)
 * Menggabungkan pembacaan konfigurasi environment (.env)
 * dan modul @react-native-firebase untuk Android
 */

// 1. Objek Konfigurasi dari file .env
// 2. Import modul @react-native-firebase
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "@react-native-firebase/auth";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 3. Export instance siap pakai
export const auth = getAuth();
export const db = getFirestore();

// 4. Export method-method Firebase untuk kemudahan programmer
export {
  collection, createUserWithEmailAndPassword, deleteDoc, doc,
  // Auth methods & types
  getAuth, getDoc,
  // Firestore methods
  getFirestore, onAuthStateChanged, onSnapshot, orderBy, query, serverTimestamp, setDoc, signInWithEmailAndPassword, signOut, updateDoc, where, type User
};

export default {
  config: firebaseConfig,
  auth,
  db,
};
