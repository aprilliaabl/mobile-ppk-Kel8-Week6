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
import type { Sesi, UserDummy } from './types';

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
  statusKetepatan?: 'TEPAT_WAKTU' | 'TERLAMBAT';
  menitKeterlambatan?: number;
  tagihanDendaId?: string;
  lokasi?: InfoLokasiPresensi;
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

// Data presensi tidak di-seed dari kode. Snapshot awal kosong dan diisi listener Firestore.
export const presensiStore: CatatanPresensi[] = [];

let presensiSnapshot: CatatanPresensi[] = [];
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

// Helper untuk menambah catatan presensi secara sinkron dengan validasi duplikasi
export function catatPresensi(
  data: CatatanPresensi,
  statusSesiSaatIni: Sesi['status'] = 'dibuka'
): HasilSubmitPresensi {
  if (!data.sesiId?.trim() || !data.praktikanId?.trim() || !data.namaPraktikan?.trim()) {
    return { ok: false, error: 'Data praktikan atau sesi tidak valid.' };
  }
  if (statusSesiSaatIni !== 'dibuka') {
    return {
      ok: false,
      error:
        statusSesiSaatIni === 'belum_dibuka'
          ? 'Presensi ditolak karena sesi praktikum belum dibuka.'
          : 'Presensi ditolak karena sesi praktikum sudah ditutup.',
    };
  }

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
}

/**
 * FR-07: Submit presensi dengan validasi status sesi, ID deterministik,
 * proteksi transaksi Firestore (jika terkonfigurasi), dan pencegahan duplikasi.
 */
export async function submitPresensi(params: {
  sesi: Sesi | undefined;
  praktikan: UserDummy | undefined;
  lokasi?: InfoLokasiPresensi;
  requireAuth?: boolean;
  requireLokasi?: boolean;
}): Promise<HasilSubmitPresensi> {
  const {
    sesi,
    praktikan,
    lokasi,
    requireAuth = false,
    requireLokasi = false,
  } = params;

  if (!sesi || !sesi.id?.trim()) {
    return { ok: false, error: 'Sesi praktikum tidak ditemukan.' };
  }
  if (!praktikan || !praktikan.id?.trim() || praktikan.role !== 'praktikan') {
    return { ok: false, error: 'User tidak terautentikasi atau bukan praktikan.' };
  }
  if (requireAuth && (!auth || !auth.currentUser)) {
    return { ok: false, error: 'Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu.' };
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
    return {
      ok: false,
      error: 'Lokasi perangkat tidak dapat diperoleh. Pastikan GPS dan izin lokasi aktif.',
    };
  }
  if (lokasi && lokasi.jarakMeter > lokasi.radiusMeter) {
    return {
      ok: false,
      error: `Presensi ditolak karena lokasi berada di luar radius laboratorium (${lokasi.jarakMeter}m > ${lokasi.radiusMeter}m).`,
    };
  }

  // Jika user login via Firebase Auth, gunakan UID yang terautentikasi untuk memenuhi firestore.rules
  const effectivePraktikanId =
    isFirebaseConfigured && auth?.currentUser ? auth.currentUser.uid : praktikan.id;

  const docId = buatIdPresensi(sesi.id, effectivePraktikanId);
  if (inFlightKeys.has(docId)) {
    return { ok: false, error: 'Permintaan presensi sedang diproses.' };
  }
  if (cekSudahPresensi(sesi.id, effectivePraktikanId)) {
    return { ok: false, error: 'Kamu sudah tercatat hadir pada sesi ini.' };
  }

  inFlightKeys.add(docId);
  try {
    const now = new Date();
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
      }
      const firestoreDb = db;
      await runTransaction(firestoreDb, async (tx) => {
        const sesiRef = doc(firestoreDb, COLLECTIONS.SESI, sesi.id);
        const presensiRef = doc(firestoreDb, COLLECTIONS.PRESENSI, docId);

        const [sesiSnap, presensiSnap] = await Promise.all([
          tx.get(sesiRef),
          tx.get(presensiRef),
        ]);

        if (!sesiSnap.exists()) {
          if (!isDemoLocalSesi) {
            throw new Error('SESSION_NOT_FOUND');
          }
        } else {
          const serverStatus = sesiSnap.data()?.status;
          if (serverStatus !== 'dibuka') {
            throw new Error('SESSION_NOT_OPEN');
          }
        }
        if (presensiSnap.exists()) {
          throw new Error('DUPLICATE_ATTENDANCE');
        }

        tx.set(presensiRef, {
          ...record,
          createdAt: serverTimestamp(),
        });
      });
    }

    return catatPresensi(record, sesi.status);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHENTICATED') {
      return { ok: false, error: 'Presensi ditolak karena pengguna belum terautentikasi.' };
    }
    if (msg === 'SESSION_NOT_FOUND') {
      return { ok: false, error: 'Sesi praktikum tidak ditemukan di server.' };
    }
    if (msg === 'SESSION_NOT_OPEN') {
      return { ok: false, error: 'Presensi ditolak karena sesi di server tidak sedang dibuka.' };
    }
    if (msg === 'DUPLICATE_ATTENDANCE') {
      return { ok: false, error: 'Kamu sudah melakukan presensi pada sesi ini.' };
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

export function resetPresensiDemo() {
  presensiStore.splice(0, presensiStore.length);
  emitPresensi();
}
