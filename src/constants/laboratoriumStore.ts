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

export function dengarLaboratorium(onData: (list: Laboratorium[]) => void, onError?: (err: Error) => void) {
  if (!labAktif()) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db!, COLLECTIONS.LABORATORIUM), orderBy('nama', 'asc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(dariDoc)),
    (err) => {
      console.warn('[Laboratorium] Gagal berlangganan Firestore:', err);
      onError?.(err);
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
}

/** FR-01: hapus laboratorium beserta keanggotaannya. Ditolak bila masih ada sesi yang memakainya. */
export async function hapusLaboratorium(id: string): Promise<void> {
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
