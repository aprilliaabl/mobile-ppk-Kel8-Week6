import { useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, db, isFirebaseConfigured } from '../config/firebase';
import { klasifikasikanAlasanIzin } from '../ai/absenceClassifier';
import type { SentimentResult } from '../ai/sentiment';
import { cekSudahPresensi, formatJamPresensi, formatTanggalPresensi } from './presensiStore';
import type { KlasifikasiAI, PengajuanIzin, Role, Sesi, UserDummy } from './types';

export interface HasilSubmitIzin {
  ok: boolean;
  data?: PengajuanIzin;
  error?: string;
}

export function buatIdIzin(sesiId: string, praktikanId: string): string {
  return `${sesiId.trim()}_${praktikanId.trim()}`;
}

function buatSeedIzin(): PengajuanIzin[] {
  const alasanContoh =
    'Mohon maaf kak, saya izin tidak dapat hadir mengikuti praktikum Basis Data hari ini karena sedang sakit demam tinggi dan harus istirahat berdasarkan surat keterangan dokter.';
  return [
    {
      id: 's-2_u-3',
      sesiId: 's-2',
      namaSesi: 'Praktikum Basis Data',
      kelas: 'IF-2B',
      praktikanId: 'u-3',
      namaPraktikan: 'Budi Santoso',
      nimPraktikan: '22/007',
      alasan: alasanContoh,
      status: 'pending',
      klasifikasiAI: klasifikasikanAlasanIzin(alasanContoh),
      tanggalPengajuan: formatTanggalPresensi(new Date()),
      waktuPengajuan: '10.15.00',
      createdAtIso: new Date().toISOString(),
    },
  ];
}

export const izinStore: PengajuanIzin[] = buatSeedIzin();
let izinSnapshot: PengajuanIzin[] = [...izinStore];
const listeners = new Set<() => void>();
const inFlightIzin = new Set<string>();

export function emitIzin() {
  izinSnapshot = [...izinStore];
  listeners.forEach((l) => l());
}

export function subscribeIzin(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getIzinSnapshot(): PengajuanIzin[] {
  return izinSnapshot;
}

export function cekIzinSesi(sesiId: string, praktikanId: string): PengajuanIzin | undefined {
  const docId = buatIdIzin(sesiId, praktikanId);
  return izinStore.find(
    (item) => item.id === docId || (item.sesiId === sesiId && item.praktikanId === praktikanId)
  );
}

/**
 * FR-11 & FR-12: Mengajukan permohonan izin ketidakhadiran untuk sesi tertentu.
 * Memvalidasi alasan tidak kosong, mengasosiasikan ke praktikan & sesi yang benar,
 * menjalankan klasifikasi AI sebagai referensi, dan menyimpan ke Firebase dengan status awal 'pending'.
 */
export async function ajukanIzin(params: {
  sesi: Sesi | undefined;
  praktikan: UserDummy | undefined;
  alasan: string;
  customClassifier?: (text: string) => SentimentResult;
}): Promise<HasilSubmitIzin> {
  const { sesi, praktikan, alasan, customClassifier } = params;

  if (!sesi || !sesi.id?.trim()) {
    return { ok: false, error: 'Sesi praktikum tidak valid atau tidak ditemukan.' };
  }
  if (!praktikan || !praktikan.id?.trim() || praktikan.role !== 'praktikan') {
    return { ok: false, error: 'Hanya praktikan yang dapat mengajukan izin ketidakhadiran.' };
  }

  const alasanBersih = typeof alasan === 'string' ? alasan.trim() : '';
  if (!alasanBersih) {
    return { ok: false, error: 'Alasan izin wajib diisi dan tidak boleh kosong.' };
  }

  if (cekSudahPresensi(sesi.id, praktikan.id)) {
    return {
      ok: false,
      error: 'Kamu sudah tercatat hadir pada sesi ini sehingga tidak dapat mengajukan izin.',
    };
  }

  const docId = buatIdIzin(sesi.id, praktikan.id);
  if (inFlightIzin.has(docId)) {
    return { ok: false, error: 'Pengajuan izin sedang diproses.' };
  }
  if (cekIzinSesi(sesi.id, praktikan.id)) {
    return { ok: false, error: 'Kamu sudah mengajukan izin pada sesi ini.' };
  }

  inFlightIzin.add(docId);
  try {
    // FR-12: Klasifikasi alasan izin secara otomatis oleh AI dengan fallback aman
    let klasifikasiAI: KlasifikasiAI;
    try {
      klasifikasiAI = klasifikasikanAlasanIzin(alasanBersih, customClassifier);
    } catch {
      klasifikasiAI = {
        label: null,
        status: 'error',
        scores: null,
        scoreType: 'none',
        experimental: true,
        kategori: 'PERLU_TINJAUAN',
        rekomendasi: 'Perlu Tinjauan Manual (AI Tidak Tersedia)',
        catatanReferensi:
          'Klasifikasi otomatis mengalami kendala, namun pengajuan izin tetap tersimpan untuk ditinjau asisten.',
      };
    }

    const now = new Date();
    const record: PengajuanIzin = {
      id: docId,
      sesiId: sesi.id,
      namaSesi: sesi.nama,
      kelas: sesi.kelas,
      praktikanId: praktikan.id,
      namaPraktikan: praktikan.nama,
      nimPraktikan: praktikan.nim ?? '22/001',
      alasan: alasanBersih,
      // FR-12: AI tidak pernah menyetujui/menolak otomatis; status selalu 'pending' saat diajukan
      status: 'pending',
      klasifikasiAI,
      tanggalPengajuan: formatTanggalPresensi(now),
      waktuPengajuan: formatJamPresensi(now),
      createdAtIso: now.toISOString(),
    };

    if (isFirebaseConfigured && db) {
      const firestoreDb = db;
      await runTransaction(firestoreDb, async (tx) => {
        const izinRef = doc(firestoreDb, COLLECTIONS.IZIN, docId);
        const existingSnap = await tx.get(izinRef);
        if (existingSnap.exists()) {
          throw new Error('DUPLICATE_IZIN');
        }
        tx.set(izinRef, {
          ...record,
          createdAt: serverTimestamp(),
        });
      });
    }

    izinStore.unshift(record);
    emitIzin();
    return { ok: true, data: record };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'DUPLICATE_IZIN') {
      return { ok: false, error: 'Kamu sudah mengajukan izin pada sesi ini.' };
    }
    return { ok: false, error: 'Gagal menyimpan pengajuan izin ke server. Silakan coba lagi.' };
  } finally {
    inFlightIzin.delete(docId);
  }
}

/**
 * FR-13: Asisten menyetujui ('disetujui') atau menolak ('ditolak') pengajuan izin yang masih 'pending'.
 * - Hanya pengguna dengan role 'asisten' yang diizinkan.
 * - Pengajuan yang sudah diproses ('disetujui' / 'ditolak') tidak dapat diproses ulang.
 */
export async function prosesKeputusanIzin(params: {
  izinId: string;
  keputusan: 'disetujui' | 'ditolak';
  asisten: UserDummy | undefined;
}): Promise<HasilSubmitIzin> {
  const { izinId, keputusan, asisten } = params;

  if (!asisten || !asisten.id?.trim() || asisten.role !== 'asisten') {
    return { ok: false, error: 'Hanya asisten yang berwenang menyetujui atau menolak izin.' };
  }
  if (keputusan !== 'disetujui' && keputusan !== 'ditolak') {
    return { ok: false, error: 'Keputusan tidak valid.' };
  }
  if (!izinId?.trim()) {
    return { ok: false, error: 'ID pengajuan izin tidak valid.' };
  }

  const idx = izinStore.findIndex((item) => item.id === izinId);
  if (idx === -1) {
    return { ok: false, error: 'Data pengajuan izin tidak ditemukan.' };
  }

  const target = izinStore[idx];
  if (target.status !== 'pending') {
    return {
      ok: false,
      error: 'Pengajuan izin ini sudah diproses sebelumnya dan tidak dapat diubah lagi.',
    };
  }

  if (inFlightIzin.has(izinId)) {
    return { ok: false, error: 'Keputusan sedang diproses.' };
  }

  inFlightIzin.add(izinId);
  try {
    const diprosesPada = new Date().toISOString();
    const diprosesOleh = asisten.nama;

    if (isFirebaseConfigured && db) {
      const firestoreDb = db;
      await runTransaction(firestoreDb, async (tx) => {
        const izinRef = doc(firestoreDb, COLLECTIONS.IZIN, izinId);
        const snap = await tx.get(izinRef);
        if (snap.exists()) {
          const currentStatus = snap.data()?.status;
          if (currentStatus !== 'pending') {
            throw new Error('ALREADY_PROCESSED');
          }
          tx.update(izinRef, {
            status: keputusan,
            diprosesOleh,
            diprosesPada,
            updatedAt: serverTimestamp(),
          });
        } else {
          tx.set(izinRef, {
            ...target,
            status: keputusan,
            diprosesOleh,
            diprosesPada,
            updatedAt: serverTimestamp(),
          });
        }
      });
    }

    const updated: PengajuanIzin = {
      ...target,
      status: keputusan,
      diprosesOleh,
      diprosesPada,
    };
    izinStore[idx] = updated;
    emitIzin();
    return { ok: true, data: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'ALREADY_PROCESSED') {
      return {
        ok: false,
        error: 'Pengajuan izin ini sudah diproses sebelumnya dan tidak dapat diubah lagi.',
      };
    }
    return { ok: false, error: 'Gagal menyimpan keputusan izin ke server.' };
  } finally {
    inFlightIzin.delete(izinId);
  }
}

/**
 * FR-13: Mengambil daftar pengajuan izin untuk asisten (dapat difilter per sesi).
 * Jika dipanggil oleh non-asisten, mengembalikan array kosong.
 */
export function getDaftarIzinAsisten(sesiId?: string, role: Role = 'asisten'): PengajuanIzin[] {
  if (role !== 'asisten') return [];
  if (!sesiId) return [...izinStore];
  return izinStore.filter((item) => item.sesiId === sesiId);
}

/**
 * FR-13: Hook real-time daftar pengajuan izin untuk asisten.
 */
export function useDaftarIzinAsisten(sesiId?: string, role: Role = 'asisten'): PengajuanIzin[] {
  const list = useSyncExternalStore(subscribeIzin, getIzinSnapshot, getIzinSnapshot);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || role !== 'asisten') return;
    const colRef = collection(db, COLLECTIONS.IZIN);
    const q = sesiId ? query(colRef, where('sesiId', '==', sesiId)) : query(colRef);
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let changed = false;
        snap.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data() as PengajuanIzin;
            const docId = change.doc.id || buatIdIzin(data.sesiId, data.praktikanId);
            const idx = izinStore.findIndex((item) => item.id === docId);
            const merged: PengajuanIzin = {
              ...data,
              id: docId,
              klasifikasiAI: data.klasifikasiAI ?? klasifikasikanAlasanIzin(data.alasan ?? ''),
            };
            if (idx === -1) {
              izinStore.unshift(merged);
              changed = true;
            } else {
              izinStore[idx] = merged;
              changed = true;
            }
          }
        });
        if (changed) emitIzin();
      },
      (err) => {
        console.warn('[Firestore] Listener daftar izin asisten error:', err);
      }
    );
    return () => unsubscribe();
  }, [sesiId, role]);

  return useMemo(() => {
    if (role !== 'asisten') return [];
    if (!sesiId) return list;
    return list.filter((item) => item.sesiId === sesiId);
  }, [list, sesiId, role]);
}

/**
 * FR-14: Mengambil daftar pengajuan izin milik seorang praktikan secara privat.
 * Praktikan hanya dapat mengakses miliknya sendiri (`viewerId === praktikanId`)
 * dan tidak dapat melihat pengajuan izin milik praktikan lain.
 */
export function getRiwayatIzinPraktikan(
  praktikanId: string,
  viewerId: string = praktikanId,
  viewerRole: Role = 'praktikan'
): PengajuanIzin[] {
  if (!praktikanId?.trim()) return [];
  if (viewerRole === 'praktikan' && viewerId !== praktikanId) {
    return [];
  }
  return izinStore.filter((item) => item.praktikanId === praktikanId);
}

export function useIzinSesiPraktikan(
  sesiId: string | undefined,
  praktikanId: string | undefined
): PengajuanIzin | undefined {
  const list = useSyncExternalStore(subscribeIzin, getIzinSnapshot, getIzinSnapshot);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !sesiId || !praktikanId) return;
    const docId = buatIdIzin(sesiId, praktikanId);
    const ref = doc(db, COLLECTIONS.IZIN, docId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as PengajuanIzin;
        const idx = izinStore.findIndex((item) => item.id === docId);
        const merged: PengajuanIzin = { ...data, id: docId };
        if (idx === -1) {
          izinStore.unshift(merged);
        } else {
          izinStore[idx] = merged;
        }
        emitIzin();
      },
      (err) => {
        console.warn('[Firestore] Listener status izin sesi praktikan error:', err);
      }
    );
    return () => unsubscribe();
  }, [sesiId, praktikanId]);

  if (!sesiId || !praktikanId) return undefined;
  const docId = buatIdIzin(sesiId, praktikanId);
  return list.find(
    (item) =>
      (item.id === docId || (item.sesiId === sesiId && item.praktikanId === praktikanId)) &&
      item.praktikanId === praktikanId
  );
}

/**
 * FR-14: Hook real-time bagi praktikan untuk memantau seluruh pengajuan izin miliknya sendiri.
 * Memfilter query berdasarkan `praktikanId` sehingga permintaan praktikan lain tidak pernah terekspos.
 */
export function useRiwayatIzinPraktikan(praktikanId: string): PengajuanIzin[] {
  const list = useSyncExternalStore(subscribeIzin, getIzinSnapshot, getIzinSnapshot);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !praktikanId) return;
    const q = query(
      collection(db, COLLECTIONS.IZIN),
      where('praktikanId', '==', praktikanId)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let changed = false;
        snap.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data() as PengajuanIzin;
            if (data.praktikanId !== praktikanId) return;
            const docId = change.doc.id || buatIdIzin(data.sesiId, data.praktikanId);
            const idx = izinStore.findIndex((item) => item.id === docId);
            const merged: PengajuanIzin = { ...data, id: docId };
            if (idx === -1) {
              izinStore.unshift(merged);
              changed = true;
            } else {
              izinStore[idx] = merged;
              changed = true;
            }
          }
        });
        if (changed) emitIzin();
      },
      (err) => {
        console.warn('[Firestore] Listener riwayat izin praktikan error:', err);
      }
    );
    return () => unsubscribe();
  }, [praktikanId]);

  return useMemo(() => {
    if (!praktikanId) return [];
    return list.filter((item) => item.praktikanId === praktikanId);
  }, [list, praktikanId]);
}

export function resetIzinDemo() {
  izinStore.splice(0, izinStore.length, ...buatSeedIzin());
  emitIzin();
}
