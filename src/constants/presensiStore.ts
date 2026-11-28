import { useEffect, useSyncExternalStore } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { auth, COLLECTIONS, db, isFirebaseConfigured } from '../config/firebase';
import { hitungJarakMeter } from './laboratorium';
import type { Pengguna, Sesi } from './types';

const GRACE_BAWAAN_MENIT_PRESENSI = 15;

export interface InfoLokasiPresensi {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  jarakMeter: number;
  radiusMeter: number;
  labId?: string;
  namaLab?: string;
}

export interface CatatanPresensi {
  /** Deterministic ID: `${sesiId}_${praktikanId}` */
  id?: string;
  sesiId: string;
  namaSesi: string;
  kelas: string;
  praktikanId: string;
  namaPraktikan: string;
  nimPraktikan?: string;
  tanggal: string; // contoh: "Kamis, 15 Okt 2026"
  waktuKehadiran: string; // contoh: "08.10.25"
  createdAtIso?: string;
  status: 'HADIR';
<<<<<<< HEAD
  /** ID laboratorium tempat presensi dilakukan (FR-18). */
  labId?: string;
=======
  statusKetepatan?: 'TEPAT_WAKTU' | 'TERLAMBAT';
  menitKeterlambatan?: number;
  tagihanDendaId?: string;
>>>>>>> origin/main
  lokasi?: InfoLokasiPresensi;
  /** Jarak perangkat ke laboratorium saat presensi (meter). */
  jarakMeter?: number;
  /** true jika hadir melewati batas toleransi (grace period) laboratorium. */
  terlambat?: boolean;
  menitTerlambat?: number;
}

export interface HasilSubmitPresensi {
  ok: boolean;
  data?: CatatanPresensi;
  error?: string;
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Membentuk ID dokumen deterministik untuk mencegah duplikasi presensi pada sesi yang sama. */
export function buatIdPresensi(sesiId: string, praktikanId: string): string {
  return `${sesiId.trim()}_${praktikanId.trim()}`;
}

export function formatJamPresensi(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`;
}

export function formatTanggalPresensi(d: Date): string {
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}`;
}

<<<<<<< HEAD
// Cache dalam memori yang disinkronkan dari Firestore secara real-time
export const presensiStore: CatatanPresensi[] = [];

let presensiSnapshot: CatatanPresensi[] = [...presensiStore];
=======
// Data presensi tidak di-seed dari kode. Snapshot awal kosong dan diisi listener Firestore.
export const presensiStore: CatatanPresensi[] = [];

let presensiSnapshot: CatatanPresensi[] = [];
>>>>>>> origin/main
const listeners = new Set<() => void>();
const inFlightKeys = new Set<string>();

export function emitPresensi() {
  presensiSnapshot = [...presensiStore];
  listeners.forEach((l) => l());
}

export function subscribePresensi(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPresensiSnapshot(): CatatanPresensi[] {
  return presensiSnapshot;
}

/** Galat dengan pesan yang siap ditampilkan ke praktikan. */
class GalatPresensi extends Error {}

<<<<<<< HEAD
/** Firestore menolak nilai `undefined`, jadi field kosong dibuang sebelum disimpan. */
function bersihkan<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
=======
  const docId = buatIdPresensi(data.sesiId, data.praktikanId);
  const sudahAda = presensiStore.some(
    (p) =>
      buatIdPresensi(p.sesiId, p.praktikanId) === docId ||
      (p.sesiId === data.sesiId && p.praktikanId === data.praktikanId)
  );
  if (sudahAda) {
    return { ok: false, error: 'Kamu sudah melakukan presensi pada sesi ini.' };
  }

  const record: CatatanPresensi = {
    ...data,
    id: docId,
    nimPraktikan: data.nimPraktikan,
    createdAtIso: data.createdAtIso ?? new Date().toISOString(),
    status: 'HADIR',
  };

  presensiStore.unshift(record);
  emitPresensi();
  return { ok: true, data: record };
>>>>>>> origin/main
}

/**
 * FR-07 & FR-18: mencatat presensi di dalam transaksi Firestore.
 * Di dalam transaksi diperiksa ulang: sesi sedang dibuka, belum pernah presensi, dan jarak ke
 * laboratorium dihitung dari koordinat laboratorium di server (bukan angka dari tampilan).
 */
export async function submitPresensi(params: {
  sesi: Sesi | undefined;
  praktikan: Pengguna | undefined;
  lokasi?: InfoLokasiPresensi;
  requireLokasi?: boolean;
}): Promise<HasilSubmitPresensi> {
  const { sesi, praktikan, lokasi, requireLokasi = true } = params;

  if (!sesi || !sesi.id?.trim()) return { ok: false, error: 'Sesi praktikum tidak ditemukan.' };
  if (!praktikan || !praktikan.id?.trim() || praktikan.role !== 'praktikan') {
    return { ok: false, error: 'Akun tidak dikenali sebagai praktikan.' };
  }
  if (!isFirebaseConfigured || !db) {
    return { ok: false, error: 'Firebase belum dikonfigurasi. Periksa file .env.' };
  }
  if (!auth?.currentUser || auth.currentUser.uid !== praktikan.id) {
    return { ok: false, error: 'Sesi login tidak ditemukan. Silakan login kembali.' };
  }
  if (sesi.status !== 'dibuka') {
    return {
      ok: false,
      error:
        sesi.status === 'belum_dibuka'
          ? 'Presensi belum dapat dilakukan karena sesi belum dibuka oleh asisten.'
          : 'Presensi ditolak karena sesi praktikum telah ditutup.',
    };
  }
  if (requireLokasi && !lokasi) {
    return { ok: false, error: 'Lokasi perangkat tidak dapat diperoleh. Pastikan GPS dan izin lokasi aktif.' };
  }

  const uid = auth.currentUser.uid;
  const docId = buatIdPresensi(sesi.id, uid);
  if (inFlightKeys.has(docId)) return { ok: false, error: 'Permintaan presensi sedang diproses.' };
  if (cekSudahPresensi(sesi.id, uid)) return { ok: false, error: 'Kamu sudah tercatat hadir pada sesi ini.' };

  inFlightKeys.add(docId);
  try {
    const firestoreDb = db;
    const now = new Date();
<<<<<<< HEAD
    let hasil!: CatatanPresensi;

    await runTransaction(firestoreDb, async (tx) => {
      const sesiRef = doc(firestoreDb, COLLECTIONS.SESI, sesi.id);
      const presensiRef = doc(firestoreDb, COLLECTIONS.PRESENSI, docId);
      const [sesiSnap, presensiSnap] = await Promise.all([tx.get(sesiRef), tx.get(presensiRef)]);

      if (!sesiSnap.exists()) throw new GalatPresensi('Sesi praktikum tidak ditemukan di server.');
      const dataSesi = sesiSnap.data();
      if (dataSesi.status !== 'dibuka') throw new GalatPresensi('Presensi ditolak karena sesi di server tidak sedang dibuka.');
      if (presensiSnap.exists()) throw new GalatPresensi('Kamu sudah melakukan presensi pada sesi ini.');

      // Koordinat, radius, dan grace period diambil dari dokumen laboratorium (acuan FR-19).
      const labId: string | undefined = dataSesi.laboratoriumId ? String(dataSesi.laboratoriumId) : undefined;
      let infoLokasi: InfoLokasiPresensi | undefined;
      let grace = GRACE_BAWAAN_MENIT_PRESENSI;
      if (labId) {
        const labSnap = await tx.get(doc(firestoreDb, COLLECTIONS.LABORATORIUM, labId));
        if (labSnap.exists()) {
          const lab = labSnap.data();
          grace = Number(lab.gracePeriodMinutes ?? GRACE_BAWAAN_MENIT_PRESENSI);
          if (lokasi) {
            const jarak = hitungJarakMeter(lokasi.latitude, lokasi.longitude, Number(lab.latitude), Number(lab.longitude));
            const radius = Number(lab.radius ?? 25);
            if (jarak > radius) {
              throw new GalatPresensi(
                `Presensi ditolak karena kamu berada di luar radius laboratorium (${jarak} m dari titik lab, radius ${radius} m).`
              );
            }
            infoLokasi = bersihkan({
              latitude: lokasi.latitude,
              longitude: lokasi.longitude,
              accuracy: typeof lokasi.accuracy === 'number' ? lokasi.accuracy : undefined,
              jarakMeter: jarak,
              radiusMeter: radius,
              labId,
              namaLab: String(lab.nama ?? ''),
            }) as InfoLokasiPresensi;
          }
        } else if (requireLokasi) {
          throw new GalatPresensi('Data laboratorium sesi ini tidak ditemukan. Hubungi asisten.');
        }
      } else if (requireLokasi) {
        throw new GalatPresensi('Sesi ini belum dikaitkan dengan laboratorium, sehingga lokasi tidak dapat diperiksa.');
=======
    // FR-14 & FR-15: Hitung status keterlambatan berdasarkan waktu mulai sesi & grace period
    const { hitungStatusKeterlambatan, buatTagihanDenda } = await import('./dendaStore');
    const validasiLate = hitungStatusKeterlambatan(sesi, now);
    const statusKetepatan = validasiLate.isTerlambat ? 'TERLAMBAT' : 'TEPAT_WAKTU';

    const record: CatatanPresensi = {
      id: docId,
      sesiId: sesi.id,
      namaSesi: sesi.nama,
      kelas: sesi.kelas,
      praktikanId: effectivePraktikanId,
      namaPraktikan: praktikan.nama,
      nimPraktikan: praktikan.nim,
      tanggal: formatTanggalPresensi(now),
      waktuKehadiran: formatJamPresensi(now),
      createdAtIso: now.toISOString(),
      status: 'HADIR',
      statusKetepatan,
      menitKeterlambatan: validasiLate.menitKeterlambatan,
      ...(lokasi ? { lokasi } : {}),
    };

    // FR-15: Jika terlambat, buat tagihan denda otomatis (idempotent, anti tagihan ganda)
    if (validasiLate.isTerlambat) {
      try {
        const tagihan = await buatTagihanDenda({
          sesi,
          praktikanId: effectivePraktikanId,
          namaPraktikan: praktikan.nama,
          nimPraktikan: praktikan.nim,
          presensiId: docId,
          menitKeterlambatan: validasiLate.menitKeterlambatan,
          nominal: validasiLate.nominalDenda,
        });
        record.tagihanDendaId = tagihan.id;
      } catch (tagihanErr) {
        console.warn('[Presensi] Gagal membuat tagihan denda otomatis:', tagihanErr);
      }
    }

    // Tulis ke Firestore apabila Firebase aktif dan sesi ini bukan data demo lokal (atau user sedang login Firebase)
    const isDemoLocalSesi = /^s-\d+$/.test(sesi.id);
    if (isFirebaseConfigured && db && (auth?.currentUser || !isDemoLocalSesi)) {
      if (!auth?.currentUser) {
        throw new Error('UNAUTHENTICATED');
>>>>>>> origin/main
      }

      const mulai = new Date(String(dataSesi.waktuMulai));
      const selisihMenit = Math.floor((now.getTime() - mulai.getTime()) / 60000);
      const terlambat = !Number.isNaN(mulai.getTime()) && selisihMenit > grace;

      hasil = bersihkan({
        id: docId,
        sesiId: sesi.id,
        namaSesi: String(dataSesi.nama ?? sesi.nama),
        kelas: String(dataSesi.kelas ?? sesi.kelas),
        praktikanId: uid,
        namaPraktikan: praktikan.nama,
        nimPraktikan: praktikan.nim ?? '',
        tanggal: formatTanggalPresensi(now),
        waktuKehadiran: formatJamPresensi(now),
        createdAtIso: now.toISOString(),
        status: 'HADIR' as const,
        labId,
        lokasi: infoLokasi,
        jarakMeter: infoLokasi?.jarakMeter,
        terlambat,
        menitTerlambat: terlambat ? Math.max(0, selisihMenit - grace) : 0,
      }) as CatatanPresensi;

      tx.set(presensiRef, { ...hasil, createdAt: serverTimestamp() });
    });

    presensiStore.unshift(hasil);
    emitPresensi();
    return { ok: true, data: hasil };
  } catch (err: unknown) {
    if (err instanceof GalatPresensi) return { ok: false, error: err.message };
    const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : '';
    if (code.includes('permission-denied')) {
      return { ok: false, error: 'Presensi ditolak server: sesi tidak dibuka, lokasi di luar radius, atau kamu sudah presensi.' };
    }
    if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
      return { ok: false, error: 'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.' };
    }
    return { ok: false, error: 'Gagal menyimpan presensi ke server. Silakan coba lagi.' };
  } finally {
    inFlightKeys.delete(docId);
  }
}

// Helper untuk mengecek apakah praktikan sudah presensi di sesi tertentu
export function cekSudahPresensi(sesiId: string, praktikanId: string): CatatanPresensi | undefined {
  const docId = buatIdPresensi(sesiId, praktikanId);
  return presensiStore.find(
    (p) =>
      buatIdPresensi(p.sesiId, p.praktikanId) === docId ||
      (p.sesiId === sesiId && p.praktikanId === praktikanId)
  );
}

// Helper untuk mengambil seluruh riwayat presensi praktikan tertentu
export function getRiwayatPraktikan(praktikanId: string): CatatanPresensi[] {
  return presensiStore.filter((p) => p.praktikanId === praktikanId);
}

/** Hook reaktif untuk memantau catatan presensi seorang praktikan pada sesi tertentu. */
export function usePresensiPraktikanSesi(
  sesiId: string | undefined,
  praktikanId: string | undefined
): CatatanPresensi | undefined {
  const list = useSyncExternalStore(subscribePresensi, getPresensiSnapshot, getPresensiSnapshot);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !sesiId || !praktikanId) return;
    const docId = buatIdPresensi(sesiId, praktikanId);
    const ref = doc(db, COLLECTIONS.PRESENSI, docId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as CatatanPresensi;
        const existsIdx = presensiStore.findIndex(
          (p) => buatIdPresensi(p.sesiId, p.praktikanId) === docId
        );
        if (existsIdx === -1) {
          presensiStore.unshift({ ...data, id: docId });
          emitPresensi();
        }
      },
      (err) => {
        console.warn('[Firestore] Listener presensi error:', err);
      }
    );
    return () => unsubscribe();
  }, [sesiId, praktikanId]);

  if (!sesiId || !praktikanId) return undefined;
  const docId = buatIdPresensi(sesiId, praktikanId);
  return list.find(
    (p) =>
      buatIdPresensi(p.sesiId, p.praktikanId) === docId ||
      (p.sesiId === sesiId && p.praktikanId === praktikanId)
  );
}

/** Hook reaktif untuk memantau seluruh daftar riwayat presensi milik seorang praktikan. */
export function useRiwayatPraktikan(praktikanId: string): CatatanPresensi[] {
  const list = useSyncExternalStore(subscribePresensi, getPresensiSnapshot, getPresensiSnapshot);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !praktikanId) return;
    const q = query(
      collection(db, COLLECTIONS.PRESENSI),
      where('praktikanId', '==', praktikanId)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let changed = false;
        snap.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data() as CatatanPresensi;
            const docId = change.doc.id || buatIdPresensi(data.sesiId, data.praktikanId);
            const idx = presensiStore.findIndex(
              (p) => buatIdPresensi(p.sesiId, p.praktikanId) === docId
            );
            if (idx === -1) {
              presensiStore.unshift({ ...data, id: docId });
              changed = true;
            }
          }
        });
        if (changed) emitPresensi();
      },
      (err) => {
        console.warn('[Firestore] Listener riwayat presensi error:', err);
      }
    );
    return () => unsubscribe();
  }, [praktikanId]);

  return list.filter((p) => p.praktikanId === praktikanId);
}

<<<<<<< HEAD
/** Mengosongkan cache lokal (dipanggil saat logout agar data pengguna lain tidak tersisa). */
export function bersihkanPresensiLokal() {
=======
export function resetPresensiDemo() {
>>>>>>> origin/main
  presensiStore.splice(0, presensiStore.length);
  emitPresensi();
}
