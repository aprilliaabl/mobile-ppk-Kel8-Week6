
import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from 'firebase/app';

import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length > 0
      ? getApp()
      : initializeApp(firebaseConfig);

    dbInstance = getFirestore(appInstance);

    try {
      authInstance = initializeAuth(appInstance, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (error) {
      const firebaseError = error as { code?: string };

      if (firebaseError.code === 'auth/already-initialized') {
        authInstance = getAuth(appInstance);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.warn('[Firebase] Gagal melakukan inisialisasi:', error);
  }
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;

export const COLLECTIONS = {
  USERS: 'users',
  SESI: 'sesi',
  PRESENSI: 'presensi',
  IZIN: 'izin',
} as const;