import { collection, onSnapshot } from 'firebase/firestore';
import { useSyncExternalStore } from 'react';
import { COLLECTIONS, db, isFirebaseConfigured } from '../config/firebase';
import type { Laboratorium, Sesi } from './types';

/**
 * Daftar master laboratorium default beserta koordinat GPS dan radius presensi (meter).
 * Dapat di-override oleh dokumen pada koleksi Firestore `laboratorium` apabila tersedia.
 */
export const DEFAULT_LABORATORIUM: Laboratorium[] = [
  {
    id: 'lab-komputer-1',
    nama: 'Lab Komputer 1',
    gedung: 'Gedung Laboratorium Terpadu Lt. 1',
    latitude: -7.76542,
    longitude: 110.37258,
    radiusMeter: 100,
  },
  {
    id: 'lab-komputer-2',
    nama: 'Lab Komputer 2',
    gedung: 'Gedung Laboratorium Terpadu Lt. 2',
    latitude: -7.76548,
    longitude: 110.37264,
    radiusMeter: 100,
  },
  {
    id: 'lab-komputer-3',
    nama: 'Lab Komputer 3',
    gedung: 'Gedung Laboratorium Terpadu Lt. 3',
    latitude: -7.76554,
    longitude: 110.37270,
    radiusMeter: 100,
  },
  {
    id: 'lab-jaringan',
    nama: 'Lab Jaringan',
    gedung: 'Gedung Laboratorium Terpadu Lt. 2',
    latitude: -7.76560,
    longitude: 110.37275,
    radiusMeter: 100,
  },
];

let labState: Laboratorium[] = [...DEFAULT_LABORATORIUM];
const labListeners = new Set<() => void>();
let unsubscribeLabFS: (() => void) | null = null;

function emitLab() {
  labState = [...labState];
  labListeners.forEach((l) => l());
}

function mulaiListenerLab() {
  if (!isFirebaseConfigured || !db || unsubscribeLabFS) return;
  try {
    unsubscribeLabFS = onSnapshot(
      collection(db, COLLECTIONS.LABORATORIUM),
      (snap) => {
        if (snap.empty) return;
        const dariServer: Laboratorium[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (
            typeof d.nama === 'string' &&
            typeof d.latitude === 'number' &&
            typeof d.longitude === 'number'
          ) {
            dariServer.push({
              id: docSnap.id,
              nama: d.nama,
              gedung: typeof d.gedung === 'string' ? d.gedung : undefined,
              latitude: d.latitude,
              longitude: d.longitude,
              radiusMeter:
                typeof d.radiusMeter === 'number' && d.radiusMeter > 0
                  ? d.radiusMeter
                  : 100,
            });
          }
        });
        if (dariServer.length > 0) {
          // Gabungkan data server dengan default (server meng-override ID/nama yang sama)
          const map = new Map<string, Laboratorium>();
          DEFAULT_LABORATORIUM.forEach((l) => map.set(l.id, l));
          dariServer.forEach((l) => map.set(l.id, l));
          labState = Array.from(map.values());
          emitLab();
        }
      },
      (err) => {
        console.warn('[Firestore] Listener laboratorium fallback ke default:', err);
      }
    );
  } catch {
    // Gunakan DEFAULT_LABORATORIUM jika koneksi gagal
  }
}

export function subscribeLaboratorium(listener: () => void): () => void {
  labListeners.add(listener);
  if (labListeners.size === 1) mulaiListenerLab();
  return () => {
    labListeners.delete(listener);
    if (labListeners.size === 0 && unsubscribeLabFS) {
      unsubscribeLabFS();
      unsubscribeLabFS = null;
    }
  };
}

export function getLaboratoriumSnapshot(): Laboratorium[] {
  return labState;
}

export function useLaboratoriumList(): Laboratorium[] {
  return useSyncExternalStore(
    subscribeLaboratorium,
    getLaboratoriumSnapshot,
    getLaboratoriumSnapshot
  );
}

/**
 * Mencari data Laboratorium berdasarkan sesi (melalui `sesi.labId` atau pencocokan nama `sesi.ruang`).
 */
export function cariLaboratoriumSesi(
  sesi: Pick<Sesi, 'ruang' | 'labId'> | undefined,
  daftarLab: Laboratorium[] = labState
): Laboratorium | undefined {
  if (!sesi) return undefined;
  if (sesi.labId) {
    const byId = daftarLab.find((l) => l.id === sesi.labId);
    if (byId) return byId;
  }
  const ruangNorm = sesi.ruang.trim().toLowerCase();
  return daftarLab.find(
    (l) =>
      l.nama.trim().toLowerCase() === ruangNorm ||
      l.id.trim().toLowerCase() === ruangNorm
  );
}

/**
 * Menghitung jarak permukaan bumi antara dua titik koordinat GPS menggunakan rumus Haversine (dalam meter).
 */
export function hitungJarakMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
