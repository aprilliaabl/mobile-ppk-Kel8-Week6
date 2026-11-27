import { useEffect, useMemo, useState } from 'react';
import { useLaboratoriumList } from './laboratoriumStore';
import type { Laboratorium, Sesi } from './types';

export { useLaboratoriumList };

/**
 * Mencari data Laboratorium berdasarkan sesi (melalui `sesi.laboratoriumId` atau pencocokan nama `sesi.ruang`).
 */
export function cariLaboratoriumSesi(
  sesi: Pick<Sesi, 'ruang' | 'laboratoriumId'> | undefined,
  daftarLab: Laboratorium[] = []
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

  // Hanya laboratorium yang terdaftar di Firestore yang ditampilkan.
  const semuaLab: Laboratorium[] = [...daftarLab];

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

