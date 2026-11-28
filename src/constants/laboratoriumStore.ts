
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useEffect, useSyncExternalStore } from 'react';
import { COLLECTIONS, db, isFirebaseConfigured } from '../config/firebase';
import type { DataLaboratorium, Laboratorium } from './types';

<<<<<<< HEAD
=======
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

>>>>>>> origin/main
let cacheLab: Laboratorium[] = [];
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
    mataKuliah: x.mataKuliah ? String(x.mataKuliah) : undefined,
    createdAtIso: x.createdAt?.toDate ? x.createdAt.toDate().toISOString() : undefined,
  };
}

export const labAktif = (): boolean => isFirebaseConfigured && !!db;

<<<<<<< HEAD
export function dengarLaboratorium(onData: (list: Laboratorium[]) => void, onError?: (err: Error) => void) {
=======
/** Auto-seed dimatikan: data laboratorium harus dibuat oleh asisten di Firestore. */
export async function seedLaboratoriumKeFirestore(): Promise<void> {
  return;
}

export function dengarLaboratorium(
  onData: (list: Laboratorium[]) => void,
  onError?: (err: Error) => void
) {
>>>>>>> origin/main
  if (!labAktif()) {
    onData([]);
    return () => {};
  }
<<<<<<< HEAD
=======

>>>>>>> origin/main
  const q = query(collection(db!, COLLECTIONS.LABORATORIUM), orderBy('nama', 'asc'));

  return onSnapshot(
    q,
<<<<<<< HEAD
    (snap) => onData(snap.docs.map(dariDoc)),
    (err) => {
      console.warn('[Laboratorium] Gagal berlangganan Firestore:', err);
      onError?.(err);
=======
    (snap) => {
      if (snap.empty) {
        // Koleksi cloud kosong: tampilkan empty state, bukan data demo.
        cacheLab = [];
        onData([]);
      } else {
        const list = snap.docs.map(dariDoc);
        onData(list);
      }
    },
    (err) => {
      console.warn('[Laboratorium] Gagal berlangganan Firestore:', err);
      if (onError) onError(err);
      cacheLab = [];
      onData([]);
>>>>>>> origin/main
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

function pastikanAktif() {
  if (!labAktif()) throw new Error('Firebase belum dikonfigurasi. Periksa file .env.');
}

/** Kode laboratorium dinormalkan agar pencarian dan pengecekan duplikasi konsisten. */
export function normalkanKodeLab(kode: string): string {
  return kode.trim().toUpperCase().replace(/\s+/g, '-');
}

/** FR-01 / FR-03: tambah laboratorium. Kode dipakai sebagai ID dokumen sehingga duplikasi tidak mungkin lolos. */
export async function tambahLaboratorium(data: DataLaboratorium): Promise<string> {
<<<<<<< HEAD
  pastikanAktif();
  const kode = normalkanKodeLab(data.kode);
  if (!kode) throw new Error('Kode laboratorium wajib diisi.');
  const ref = doc(db!, COLLECTIONS.LABORATORIUM, kode);
  const [ada, sama] = await Promise.all([
    getDoc(ref),
    getDocs(query(collection(db!, COLLECTIONS.LABORATORIUM), where('kode', '==', kode), limit(1))),
  ]);
  if (ada.exists() || !sama.empty) throw new Error(`Kode ${kode} sudah digunakan laboratorium lain.`);
  await setDoc(ref, {
    ...bersihkanLab(data),
    kode,
    radius: data.radius ?? 25,
    gracePeriodMinutes: data.gracePeriodMinutes ?? 15,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** FR-01 / FR-02: ubah data atau konfigurasi laboratorium. */
export async function ubahLaboratorium(id: string, data: Partial<DataLaboratorium>): Promise<void> {
  pastikanAktif();
  await updateDoc(doc(db!, COLLECTIONS.LABORATORIUM, id), {
    ...bersihkanLab(data),
    updatedAt: serverTimestamp(),
  });
=======
  if (labAktif()) {
    const docRef = await addDoc(collection(db!, COLLECTIONS.LABORATORIUM), {
      ...data,
      radius: data.radius ?? 25,
      gracePeriodMinutes: data.gracePeriodMinutes ?? 15,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } else {
    throw new Error('Firebase belum dikonfigurasi. Data laboratorium tidak disimpan lokal.');
  }
}

export async function ubahLaboratorium(
  id: string,
  data: Partial<DataLaboratorium>
): Promise<void> {
  if (labAktif()) {
    const ref = doc(db!, COLLECTIONS.LABORATORIUM, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } else {
    throw new Error('Firebase belum dikonfigurasi. Perubahan laboratorium tidak disimpan lokal.');
  }
>>>>>>> origin/main
}

/** FR-01: hapus laboratorium beserta keanggotaannya. Ditolak bila masih ada sesi yang memakainya. */
export async function hapusLaboratorium(id: string): Promise<void> {
<<<<<<< HEAD
  pastikanAktif();
  const sesi = await getDocs(query(collection(db!, COLLECTIONS.SESI), where('laboratoriumId', '==', id), limit(1)));
  if (!sesi.empty) throw new Error('Laboratorium masih dipakai oleh sesi praktikum. Hapus atau pindahkan sesinya dulu.');
  const anggota = await getDocs(query(collection(db!, COLLECTIONS.ANGGOTA), where('laboratoriumId', '==', id)));
  const batch = writeBatch(db!);
  anggota.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db!, COLLECTIONS.LABORATORIUM, id));
  await batch.commit();
}

function bersihkanLab<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}
=======
  if (labAktif()) {
    const ref = doc(db!, COLLECTIONS.LABORATORIUM, id);
    await deleteDoc(ref);
  } else {
    throw new Error('Firebase belum dikonfigurasi. Laboratorium tidak dihapus lokal.');
  }
}
>>>>>>> origin/main
