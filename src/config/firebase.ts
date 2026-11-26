
import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from 'firebase/app';

import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';

import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Konfigurasi Firebase dari environment variable
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Memastikan seluruh konfigurasi wajib tersedia
const requiredConfigValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export const isFirebaseConfigured = requiredConfigValues.every(
  (value) =>
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value !== 'your_api_key_here'
);

// Inisialisasi Firebase
let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length > 0
      ? getApp()
      : initializeApp(firebaseConfig);

    // Firebase Authentication
    authInstance = Platform.OS === 'web'
      ? getAuth(appInstance)
      : initializeAuth(appInstance, {
          persistence: getReactNativePersistence(AsyncStorage),
        });

    // Firebase Firestore
    dbInstance = getFirestore(appInstance);

    console.log('[Firebase] Berhasil diinisialisasi.');
  } catch (error) {
    console.error(
      '[Firebase] Gagal melakukan inisialisasi:',
      error
    );
  }
} else {
  console.warn(
    '[Firebase] Konfigurasi belum lengkap. Periksa file .env.'
  );
}

// Export Firebase instances
export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

// Nama koleksi Firestore
export const COLLECTIONS = {
  USERS: 'users',
  SESI: 'sesi',
  PRESENSI: 'presensi',
  IZIN: 'izin',
  LABORATORIUM: 'laboratorium',
  TAGIHAN: 'tagihan',
} as const;
