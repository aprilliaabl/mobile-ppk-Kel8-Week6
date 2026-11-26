import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { COLLECTIONS, db, isFirebaseConfigured } from '../config/firebase';
import type { Laboratorium, Sesi } from './types';

/**
 * Daftar master laboratorium default beserta koordinat GPS dan radius presensi (meter).
 * Dapat di-override oleh dokumen pada koleksi Firestore `laboratorium` apabila tersedia.
 */
export const DEFAULT_LABORATORIUM: Laboratorium[] = [
  {
    id: 'lab-komputer-1',
    kode: 'LAB-KOMPUTER-1',
    nama: 'Lab Komputer 1',
    gedung: 'Gedung Laboratorium Terpadu Lt. 1',
    latitude: -7.76542,
    longitude: 110.37258,
    radius: 100,
  },
  {
    id: 'lab-komputer-2',
    kode: 'LAB-KOMPUTER-2',
    nama: 'Lab Komputer 2',
    gedung: 'Gedung Laboratorium Terpadu Lt. 2',
    latitude: -7.76548,
    longitude: 110.37264,
    radius: 100,
  },
  {
    id: 'lab-komputer-3',
    kode: 'LAB-KOMPUTER-3',
    nama: 'Lab Komputer 3',
    gedung: 'Gedung Laboratorium Terpadu Lt. 3',
    latitude: -7.76554,
    longitude: 110.37270,
    radius: 100,
  },
  {
    id: 'lab-jaringan',
    kode: 'LAB-JARINGAN',
    nama: 'Lab Jaringan',
    gedung: 'Gedung Laboratorium Terpadu Lt. 2',
    latitude: -7.76560,
    longitude: 110.37275,
    radius: 100,
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
              gedung: typeof d.gedung === 'string' ? d.gedung : 'Laboratorium Praktikum',
              kode: typeof d.kode === 'string' ? d.kode : docSnap.id,
              latitude: d.latitude,
              longitude: d.longitude,
              radius:
                typeof d.radius === 'number' && d.radius > 0
                  ? d.radius
                  : 100,
              gracePeriodMinutes:
                typeof d.gracePeriodMinutes === 'number' && d.gracePeriodMinutes >= 0
                  ? d.gracePeriodMinutes
                  : 15,
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
 * Mencari data Laboratorium berdasarkan sesi (melalui `sesi.laboratoriumId` atau pencocokan nama `sesi.ruang`).
 */
export function cariLaboratoriumSesi(
  sesi: Pick<Sesi, 'ruang' | 'laboratoriumId'> | undefined,
  daftarLab: Laboratorium[] = labState
): Laboratorium | undefined {
  if (!sesi) return undefined;
  if (sesi.laboratoriumId) {
    const byId = daftarLab.find((l) => l.id === sesi.laboratoriumId);
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

export interface JadwalPerLaboratorium {
  laboratorium: Laboratorium;
  /** Sesi praktikum yang sedang berlangsung (dibuka atau berada dalam rentang jadwal aktif) */
  sedangBerlangsung: Sesi | null;
  /** Sesi praktikum terdekat berikutnya pada laboratorium ini */
  berikutnya: Sesi | null;
  /** Seluruh daftar sesi akan datang (termasuk `berikutnya`) diurutkan kronologis */
  antreanBerikutnya: Sesi[];
  /** Total sesi yang terdaftar di laboratorium ini */
  totalSesi: number;
}

/**
 * FR-21: Menentukan praktikum yang sedang berlangsung dan praktikum berikutnya
 * pada setiap laboratorium secara deterministik berdasarkan status sesi dan waktu referensi.
 */
export function hitungJadwalPerLaboratorium(
  daftarLab: Laboratorium[],
  daftarSesi: Sesi[],
  waktuReferensi: Date = new Date()
): JadwalPerLaboratorium[] {
  const nowMs = waktuReferensi.getTime();

  // Pastikan seluruh laboratorium master terdaftar, plus ruangan tambahan dari sesi jika belum ada di master
  const semuaLab: Laboratorium[] = [...daftarLab];
  for (const s of daftarSesi) {
    const cocok = cariLaboratoriumSesi(s, semuaLab);
    if (!cocok && s.ruang.trim()) {
      const idBaru = s.ruang.trim().toLowerCase().replace(/\s+/g, '-');
      semuaLab.push({
        id: idBaru,
        kode: idBaru.toUpperCase(),
        nama: s.ruang.trim(),
        gedung: 'Laboratorium Praktikum',
        latitude: DEFAULT_LABORATORIUM[0].latitude,
        longitude: DEFAULT_LABORATORIUM[0].longitude,
        radius: 100,
      });
    }
  }

  return semuaLab.map((lab) => {
    const sesiLab = daftarSesi
      .filter((s) => cariLaboratoriumSesi(s, semuaLab)?.id === lab.id)
      .sort((a, b) => a.waktuMulai.localeCompare(b.waktuMulai));

    // 1. Cari sesi yang sedang berlangsung:
    // Prioritas A: Sesi yang statusnya 'dibuka' di server
    // Prioritas B: Sesi yang belum ditutup ('belum_dibuka') yang jadwal waktuMulai <= now <= waktuSelesai
    const sesiDibuka = sesiLab.find((s) => s.status === 'dibuka');
    const sesiDalamSlotWaktu = sesiLab.find((s) => {
      if (s.status === 'ditutup') return false;
      const mulaiMs = new Date(s.waktuMulai).getTime();
      const selesaiMs = new Date(s.waktuSelesai).getTime();
      return (
        !Number.isNaN(mulaiMs) &&
        !Number.isNaN(selesaiMs) &&
        mulaiMs <= nowMs &&
        nowMs <= selesaiMs
      );
    });

    const sedangBerlangsung = sesiDibuka ?? sesiDalamSlotWaktu ?? null;

    // 2. Cari sesi berikutnya pada laboratorium ini:
    // Sesi yang berstatus 'belum_dibuka', bukan sesi yang sedang berlangsung,
    // dan waktuMulai-nya setelah waktu sekarang (atau belum lewat waktuSelesai-nya).
    const batasMulaiMs = sedangBerlangsung
      ? Math.max(nowMs, new Date(sedangBerlangsung.waktuMulai).getTime())
      : nowMs;

    const antreanBerikutnya = sesiLab.filter((s) => {
      if (s.status !== 'belum_dibuka') return false;
      if (sedangBerlangsung && s.id === sedangBerlangsung.id) return false;
      const mulaiMs = new Date(s.waktuMulai).getTime();
      const selesaiMs = new Date(s.waktuSelesai).getTime();
      if (Number.isNaN(mulaiMs)) return false;
      return (
        mulaiMs >= batasMulaiMs ||
        (!sedangBerlangsung && !Number.isNaN(selesaiMs) && selesaiMs > nowMs)
      );
    });

    return {
      laboratorium: lab,
      sedangBerlangsung,
      berikutnya: antreanBerikutnya[0] ?? null,
      antreanBerikutnya,
      totalSesi: sesiLab.length,
    };
  });
}

/**
 * FR-21: Hook real-time untuk memantau praktikum yang sedang berlangsung dan berikutnya
 * pada setiap laboratorium, otomatis melakukan re-evaluasi saat data sesi berubah maupun setiap 30 detik.
 */
export function useJadwalLaboratorium(
  daftarSesi: Sesi[]
): JadwalPerLaboratorium[] {
  const daftarLab = useLaboratoriumList();
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(
    () => hitungJadwalPerLaboratorium(daftarLab, daftarSesi, new Date(nowTick)),
    [daftarLab, daftarSesi, nowTick]
  );
}

