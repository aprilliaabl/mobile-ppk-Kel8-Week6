/**
 * Inisialisasi Layanan Firebase (Sprint 2 - Kelompok 8)
 * Menggunakan modular Firebase JS SDK (kompatibel penuh dengan Expo SDK 57 & EAS Build)
 */

import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

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
} from 'firebase/firestore';

import { app, auth, db, isFirebaseConfigured, COLLECTIONS } from '../config/firebase';

export {
  app,
  auth,
  db,
  isFirebaseConfigured,
  COLLECTIONS,
  // Auth methods & types
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  // Firestore methods
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
};

export default {
  app,
  auth,
  db,
  isFirebaseConfigured,
  COLLECTIONS,
};
