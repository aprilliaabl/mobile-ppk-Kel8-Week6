import { useSyncExternalStore } from 'react';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS, db, isFirebaseConfigured } from '../config/firebase';
import { cekSudahPresensi, formatJamPresensi, formatTanggalPresensi } from './presensiStore';
import type { PengajuanIzin, Sesi, UserDummy } from './types';

export interface HasilSubmitIzin {
  ok: boolean;
  data?: PengajuanIzin;
  error?: string;
}

export function buatIdIzin(sesiId: string, praktikanId: string): string {
  return `${sesiId.trim()}_${praktikanId.trim()}`;
}

export const izinStore: PengajuanIzin[] = [];
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
 * FR-11: Mengajukan permohonan izin ketidakhadiran untuk sesi tertentu.
 * Memvalidasi alasan tidak kosong, mengasosiasikan ke praktikan & sesi yang benar,
 * dan menyimpan ke Firebase dengan status awal 'pending'.
 */
export async function ajukanIzin(params: {
  sesi: Sesi | undefined;
  praktikan: UserDummy | undefined;
  alasan: string;
}): Promise<HasilSubmitIzin> {
  const { sesi, praktikan, alasan } = params;

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
      status: 'pending',
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

export function useIzinSesiPraktikan(
  sesiId: string | undefined,
  praktikanId: string | undefined
): PengajuanIzin | undefined {
  const list = useSyncExternalStore(subscribeIzin, getIzinSnapshot, getIzinSnapshot);
  if (!sesiId || !praktikanId) return undefined;
  const docId = buatIdIzin(sesiId, praktikanId);
  return list.find(
    (item) => item.id === docId || (item.sesiId === sesiId && item.praktikanId === praktikanId)
  );
}

export function resetIzinDemo() {
  izinStore.splice(0, izinStore.length);
  emitIzin();
}
