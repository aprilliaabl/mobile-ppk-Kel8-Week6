import { useEffect, useSyncExternalStore } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, COLLECTIONS, db, isFirebaseConfigured } from '../config/firebase';
import type { Sesi, TagihanDenda } from './types';
import { formatTanggalPresensi } from './presensiStore';

export const DEFAULT_GRACE_PERIOD_MENIT = 15;
export const DEFAULT_NOMINAL_DENDA = 10000; // Rp 10.000

/** Deterministic ID untuk tagihan denda guna mencegah tagihan ganda (Idempotent) */
export function buatIdTagihanDenda(sesiId: string, praktikanId: string): string {
  return `denda_${sesiId.trim()}_${praktikanId.trim()}`;
}

export interface HasilValidasiKeterlambatan {
  isTerlambat: boolean;
  menitKeterlambatan: number;
  gracePeriodDigunakan: number;
  nominalDenda: number;
}

/**
 * FR-14: Attendance & Late Validation
 * Menghitung selisih waktu presensi terhadap waktu mulai sesi dan grace period.
 */
export function hitungStatusKeterlambatan(
  sesi: Sesi,
  waktuPresensi: Date = new Date()
): HasilValidasiKeterlambatan {
  const mulai = new Date(sesi.waktuMulai);
  const gracePeriod = sesi.gracePeriodMenit ?? DEFAULT_GRACE_PERIOD_MENIT;
  const nominal = sesi.nominalDenda ?? DEFAULT_NOMINAL_DENDA;

  // Batas toleransi tepat waktu
  const batasToleransi = new Date(mulai.getTime() + gracePeriod * 60 * 1000);

  // Jika waktu presensi melewati batas toleransi
  const selisihMs = waktuPresensi.getTime() - mulai.getTime();
  const menitTotalDariMulai = Math.floor(selisihMs / (60 * 1000));

  const isTerlambat = waktuPresensi.getTime() > batasToleransi.getTime();
  const menitKeterlambatan = isTerlambat ? Math.max(0, menitTotalDariMulai - gracePeriod) : 0;

  return {
    isTerlambat,
    menitKeterlambatan,
    gracePeriodDigunakan: gracePeriod,
    nominalDenda: nominal,
  };
}

// In-Memory Store & Cache
export const tagihanStore: TagihanDenda[] = [];
let tagihanSnapshot: TagihanDenda[] = [];
const listeners = new Set<() => void>();

function emitTagihan() {
  tagihanSnapshot = [...tagihanStore];
  listeners.forEach((l) => l());
}

export function subscribeTagihan(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTagihanSnapshot(): TagihanDenda[] {
  return tagihanSnapshot;
}

/**
 * FR-15: Fine Generation & Management
 * Membuat tagihan denda baru secara idempotent (anti duplikasi).
 */
export async function buatTagihanDenda(params: {
  sesi: Sesi;
  praktikanId: string;
  namaPraktikan: string;
  nimPraktikan?: string;
  presensiId?: string;
  menitKeterlambatan: number;
  nominal?: number;
}): Promise<TagihanDenda> {
  const { sesi, praktikanId, namaPraktikan, nimPraktikan, presensiId, menitKeterlambatan, nominal } = params;
  const tagihanId = buatIdTagihanDenda(sesi.id, praktikanId);
  const nominalFinal = nominal ?? sesi.nominalDenda ?? DEFAULT_NOMINAL_DENDA;

  const dataTagihan: TagihanDenda = {
    id: tagihanId,
    praktikanId,
    namaPraktikan,
    nimPraktikan,
    sesiId: sesi.id,
    namaSesi: sesi.nama,
    kelas: sesi.kelas,
    presensiId,
    nominal: nominalFinal,
    status: 'BELUM_DIBAYAR',
    alasan: `Keterlambatan presensi ${menitKeterlambatan} menit melewati batas toleransi ${sesi.gracePeriodMenit ?? DEFAULT_GRACE_PERIOD_MENIT} menit.`,
    menitKeterlambatan,
    tanggalTagihan: formatTanggalPresensi(new Date()),
    createdAtIso: new Date().toISOString(),
  };

  // Simpan ke Firestore jika online
  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, COLLECTIONS.TAGIHAN, tagihanId);
      await runTransaction(db, async (txn) => {
        const snap = await txn.get(ref);
        // FR-15 Edge Case: Cek apakah tagihan sudah pernah dibuat sebelumnya (mencegah tagihan ganda)
        if (!snap.exists()) {
          txn.set(ref, {
            ...dataTagihan,
            createdAt: serverTimestamp(),
          });
        }
      });
    } catch (err) {
      console.warn('[Tagihan] Gagal menyimpan ke Firestore (fallback lokal):', err);
    }
  }

  // Update memori lokal
  const idx = tagihanStore.findIndex((t) => t.id === tagihanId);
  if (idx === -1) {
    tagihanStore.unshift(dataTagihan);
    emitTagihan();
  }

  return dataTagihan;
}

/**
 * FR-16: Permission & Fine Exemption
 * Membebaskan denda praktikan jika pengajuan izin telah disetujui Asprak.
 */
export async function bebaskanDendaKarenaIzin(sesiId: string, praktikanId: string): Promise<void> {
  const tagihanId = buatIdTagihanDenda(sesiId, praktikanId);

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, COLLECTIONS.TAGIHAN, tagihanId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          status: 'DIBEBASKAN',
          alasanPembebasan: 'Izin praktikum telah disetujui oleh Asisten (Excused Absence).',
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('[Tagihan] Gagal update pembebasan izin di Firestore:', err);
    }
  }

  // Update lokal
  const idx = tagihanStore.findIndex((t) => t.id === tagihanId);
  if (idx !== -1) {
    tagihanStore[idx] = {
      ...tagihanStore[idx],
      status: 'DIBEBASKAN',
    };
    emitTagihan();
  }
}

/**
 * Hook reaktif untuk memantau daftar tagihan milik praktikan tertentu.
 */
export function useTagihanPraktikan(praktikanId?: string): TagihanDenda[] {
  const list = useSyncExternalStore(subscribeTagihan, getTagihanSnapshot, getTagihanSnapshot);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !praktikanId) return;

    const q = query(
      collection(db, COLLECTIONS.TAGIHAN),
      where('praktikanId', '==', praktikanId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let changed = false;
        snap.docChanges().forEach((change) => {
          const item = change.doc.data() as TagihanDenda;
          const docId = change.doc.id || item.id;
          const idx = tagihanStore.findIndex((t) => t.id === docId);

          if (change.type === 'added') {
            if (idx === -1) {
              tagihanStore.unshift({ ...item, id: docId });
              changed = true;
            }
          } else if (change.type === 'modified') {
            if (idx !== -1) {
              tagihanStore[idx] = { ...item, id: docId };
              changed = true;
            }
          } else if (change.type === 'removed') {
            if (idx !== -1) {
              tagihanStore.splice(idx, 1);
              changed = true;
            }
          }
        });
        if (changed) emitTagihan();
      },
      (err) => {
        console.warn('[Firestore] Listener tagihan denda error:', err);
      }
    );

    return () => unsubscribe();
  }, [praktikanId]);

  return praktikanId ? list.filter((t) => t.praktikanId === praktikanId) : list;
}

/**
 * Hook reaktif untuk seluruh tagihan (untuk Aslab/Asprak melihat rekap keuangan FR-10).
 */
export function useSemuaTagihan(): TagihanDenda[] {
  const list = useSyncExternalStore(subscribeTagihan, getTagihanSnapshot, getTagihanSnapshot);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const q = query(collection(db, COLLECTIONS.TAGIHAN));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let changed = false;
        snap.docChanges().forEach((change) => {
          const item = change.doc.data() as TagihanDenda;
          const docId = change.doc.id || item.id;
          const idx = tagihanStore.findIndex((t) => t.id === docId);

          if (change.type === 'added') {
            if (idx === -1) {
              tagihanStore.unshift({ ...item, id: docId });
              changed = true;
            }
          } else if (change.type === 'modified') {
            if (idx !== -1) {
              tagihanStore[idx] = { ...item, id: docId };
              changed = true;
            }
          } else if (change.type === 'removed') {
            if (idx !== -1) {
              tagihanStore.splice(idx, 1);
              changed = true;
            }
          }
        });
        if (changed) emitTagihan();
      },
      (err) => {
        console.warn('[Firestore] Listener semua tagihan error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  return list;
}
