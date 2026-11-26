import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useEffect, useSyncExternalStore } from 'react';
import { COLLECTIONS, db, isFirebaseConfigured } from '../config/firebase';
import type { DataLaboratorium, Laboratorium } from './types';

/** Koordinat Laboratorium Informatika FSM Undip (Gedung E & Gedung A) - Radius 10 Meter */
export const LAB_DEFAULT_LIST: Laboratorium[] = [
  {
    id: 'lab-1',
    nama: 'Lab Komputer 1 (Pemrograman)',
    kode: 'LAB-KOM-1',
    gedung: 'Gedung E FSM Undip',
    lantai: 2,
    latitude: -7.047909,
    longitude: 110.440866,
    radius: 10,
    gracePeriodMinutes: 15,
    deskripsi: 'Praktikum Algoritma, Struktur Data, Pemrograman Berorientasi Objek',
  },
  {
    id: 'lab-2',
    nama: 'Lab Komputer 2 (Jaringan & IoT)',
    kode: 'LAB-KOM-2',
    gedung: 'Gedung E FSM Undip',
    lantai: 3,
    latitude: -7.048050,
    longitude: 110.440950,
    radius: 10,
    gracePeriodMinutes: 15,
    deskripsi: 'Praktikum Jaringan Komputer, Sistem Operasi, dan IoT',
  },
  {
    id: 'lab-3',
    nama: 'Lab Komputer 3 (Basis Data & AI)',
    kode: 'LAB-KOM-3',
    gedung: 'Gedung E FSM Undip',
    lantai: 3,
    latitude: -7.047820,
    longitude: 110.440780,
    radius: 10,
    gracePeriodMinutes: 15,
    deskripsi: 'Praktikum Basis Data, Kecerdasan Buatan, Data Science',
  },
  {
    id: 'lab-4',
    nama: 'Lab Komputer 4 (Multimedia & Software)',
    kode: 'LAB-KOM-4',
    gedung: 'Gedung A FSM Undip',
    lantai: 2,
    latitude: -7.048350,
    longitude: 110.441200,
    radius: 10,
    gracePeriodMinutes: 15,
    deskripsi: 'Praktikum Rekayasa Perangkat Lunak, Multimedia, Grafika Komputer',
  },
];

let cacheLab: Laboratorium[] = [...LAB_DEFAULT_LIST];
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeLab(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getLabSnapshot() {
  return cacheLab;
}

function dariDoc(d: QueryDocumentSnapshot<DocumentData>): Laboratorium {
  const x = d.data();
  return {
    id: d.id,
    nama: String(x.nama ?? ''),
    kode: String(x.kode ?? ''),
    gedung: String(x.gedung ?? ''),
    lantai: x.lantai ?? 1,
    latitude: Number(x.latitude ?? 0),
    longitude: Number(x.longitude ?? 0),
    radius: Number(x.radius ?? 25),
    gracePeriodMinutes: Number(x.gracePeriodMinutes ?? 15),
    deskripsi: x.deskripsi ? String(x.deskripsi) : undefined,
    createdAtIso: x.createdAt?.toDate ? x.createdAt.toDate().toISOString() : undefined,
  };
}

export const labAktif = (): boolean => isFirebaseConfigured && !!db;

export async function seedLaboratoriumKeFirestore(): Promise<void> {
  if (!labAktif()) return;

  const colRef = collection(db!, COLLECTIONS.LABORATORIUM);
  const snap = await getDocs(colRef);

  // Jika di Firestore belum ada sama sekali, push 4 lab default
  if (snap.empty) {
    for (const lab of LAB_DEFAULT_LIST) {
      const { id, ...data } = lab;
      await setDoc(doc(colRef, id), {
        ...data,
        createdAt: serverTimestamp(),
      });
    }
  }
}

export function dengarLaboratorium(onData: (list: Laboratorium[]) => void, onError?: (err: Error) => void) {
  if (!labAktif()) {
    onData([...cacheLab]);
    return () => {};
  }

  // Jalankan auto-seed di background jika Firestore masih kosong
  seedLaboratoriumKeFirestore().catch((err) => {
    console.warn('[Laboratorium] Gagal auto-seed ke Firestore:', err);
  });

  const q = query(collection(db!, COLLECTIONS.LABORATORIUM), orderBy('nama', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        // Jika koleksi di Firestore masih kosong, pakai data default
        onData([...LAB_DEFAULT_LIST]);
      } else {
        const list = snap.docs.map(dariDoc);
        onData(list);
      }
    },
    (err) => {
      console.warn('[Laboratorium] Gagal berlangganan Firestore:', err);
      if (onError) onError(err);
      onData([...cacheLab]);
    }
  );
}

export function useLaboratoriumList(): Laboratorium[] {
  useEffect(() => {
    const unsub = dengarLaboratorium((list) => {
      cacheLab = list;
      emitChange();
    });
    return unsub;
  }, []);

  return useSyncExternalStore(subscribeLab, getLabSnapshot, getLabSnapshot);
}

export async function tambahLaboratorium(data: DataLaboratorium): Promise<string> {
  if (labAktif()) {
    const docRef = await addDoc(collection(db!, COLLECTIONS.LABORATORIUM), {
      ...data,
      radius: data.radius ?? 25,
      gracePeriodMinutes: data.gracePeriodMinutes ?? 15,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } else {
    const newId = `lab-${Date.now()}`;
    const newLab: Laboratorium = {
      ...data,
      id: newId,
      radius: data.radius ?? 25,
      gracePeriodMinutes: data.gracePeriodMinutes ?? 15,
      createdAtIso: new Date().toISOString(),
    };
    cacheLab = [newLab, ...cacheLab];
    emitChange();
    return newId;
  }
}

export async function ubahLaboratorium(id: string, data: Partial<DataLaboratorium>): Promise<void> {
  if (labAktif()) {
    const ref = doc(db!, COLLECTIONS.LABORATORIUM, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } else {
    cacheLab = cacheLab.map((item) => (item.id === id ? { ...item, ...data } : item));
    emitChange();
  }
}

export async function hapusLaboratorium(id: string): Promise<void> {
  if (labAktif()) {
    const ref = doc(db!, COLLECTIONS.LABORATORIUM, id);
    await deleteDoc(ref);
  } else {
    cacheLab = cacheLab.filter((item) => item.id !== id);
    emitChange();
  }
}
