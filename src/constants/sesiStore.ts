import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { COLLECTIONS, db, isFirebaseConfigured } from "../config/firebase";
import {
  buatIdPresensi,
  type CatatanPresensi,
  emitPresensi,
  getPresensiSnapshot,
  presensiStore,
  subscribePresensi,
} from "./presensiStore";
import { bacaCacheSesi, simpanCacheSesi } from "./cacheSesi";
import {
  bukaSesiFS,
  dengarSesi,
  hapusSesiFS,
  sesiAktif,
  tambahSesiFS,
  tutupSesiFS,
  ubahSesiFS,
} from "./sesiFirestore";
import type { BarisRekap, DataSesi, Pengguna, Role, Sesi, StatusSesi } from "./types";

/** Toleransi keterlambatan bawaan (menit) bila laboratorium sesi tidak punya konfigurasi. */
export const GRACE_BAWAAN_MENIT = 15;

function menitDariWaktu(w: string): number {
  const m = /(\d{1,2})[.:](\d{2})/.exec(w);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

// ---------- Store sederhana (di memori) supaya perubahan status sesi terlihat di semua layar ----------
// Daftar sesi diisi dari Firestore secara real-time (mulai kosong).
let sesiState: Sesi[] = [];
export interface StatusSesiData {
  loading: boolean;
  error: string | null;
  /** true jika daftar sesi berasal dari cache (koneksi terputus), bukan data terbaru dari server. */
  dariCache: boolean;
}

/** Perubahan status sesi yang dilakukan pengguna lain (FR-09), dipakai untuk notifikasi dalam aplikasi. */
export interface PerubahanSesi {
  kunci: number;
  sesi: Sesi;
  dari: StatusSesi;
  ke: StatusSesi;
}

let statusSesiState: StatusSesiData = { loading: sesiAktif(), error: null, dariCache: false };
let sudahMuatPertama = false;
let dataServerDiterima = false;
let kunciPerubahan = 0;
let perubahanTerakhir: PerubahanSesi | null = null;
let hentikanSesi: (() => void) | null = null;
let rekapVersion = 0;
const listeners = new Set<() => void>();
const emit = () => {
  rekapVersion += 1;
  listeners.forEach((l) => l());
};

// Sinkronkan perubahan presensi secara real-time ke semua subscriber rekap asisten (FR-08)
subscribePresensi(() => {
  emit();
});

/** FR-10: menampilkan salinan jadwal dari perangkat selagi menunggu server (atau saat tidak ada koneksi). */
function muatDariPerangkat() {
  bacaCacheSesi().then((cache) => {
    // Jangan menimpa data yang sudah datang dari server lebih dulu.
    if (!cache || cache.length === 0 || dataServerDiterima || sesiState.length > 0) return;
    sesiState = cache;
    statusSesiState = { loading: false, error: null, dariCache: true };
    emit();
  });
}

function mulaiListenerSesi() {
  if (!sesiAktif() || hentikanSesi) return;
  statusSesiState = { loading: sesiState.length === 0, error: null, dariCache: false };
  sudahMuatPertama = false;
  dataServerDiterima = false;
  if (sesiState.length === 0) muatDariPerangkat();
  try {
    hentikanSesi = dengarSesi(
      (daftar, info) => {
        // Saat offline, Firestore dapat mengirim snapshot kosong dari cache memori.
        // Jangan menimpa jadwal yang sudah tampil dari penyimpanan perangkat.
        if (info.dariCache && daftar.length === 0 && sesiState.length > 0) {
          statusSesiState = { loading: false, error: null, dariCache: true };
          emit();
          return;
        }

        // FR-09: catat perubahan status yang dilakukan pengguna lain.
        // Perubahan dari perangkat ini (masih tertunda) dilewati, karena penggunanya sudah tahu.
        if (sudahMuatPertama) {
          for (const baru of daftar) {
            const lama = sesiState.find((x) => x.id === baru.id);
            if (lama && lama.status !== baru.status && !info.tertunda.has(baru.id)) {
              perubahanTerakhir = { kunci: ++kunciPerubahan, sesi: baru, dari: lama.status, ke: baru.status };
            }
          }
        }
        sudahMuatPertama = true;
        if (!info.dariCache) {
          dataServerDiterima = true;
          simpanCacheSesi(daftar); // FR-10: simpan salinan terbaru dari server ke perangkat
        }
        sesiState = daftar;
        statusSesiState = { loading: false, error: null, dariCache: info.dariCache };
        emit();
      },
      (pesan) => {
        statusSesiState = { loading: false, error: pesan, dariCache: false };
        emit();
      },
    );
  } catch {
    statusSesiState = { loading: false, error: "Gagal terhubung ke Firestore.", dariCache: false };
  }
}

function hentikanListenerSesi() {
  hentikanSesi?.();
  hentikanSesi = null;
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (listeners.size === 1) mulaiListenerSesi();
  return () => {
    listeners.delete(l);
    if (listeners.size === 0) hentikanListenerSesi();
  };
}

/** Memulai ulang pendengar sesi, dipakai tombol "Coba Lagi" saat koneksi terganggu. */
export function muatUlangSesi() {
  if (listeners.size === 0) return;
  hentikanListenerSesi();
  mulaiListenerSesi();
  emit();
}
const snapshot = () => sesiState;
const snapshotVersion = () => rekapVersion;

const snapshotStatusSesi = () => statusSesiState;

/** Status pemuatan daftar sesi: sedang memuat atau gagal (mis. koneksi terputus). */
export function useSesiStatus(): StatusSesiData {
  return useSyncExternalStore(subscribe, snapshotStatusSesi, snapshotStatusSesi);
}

const snapshotPerubahan = () => perubahanTerakhir;

/** FR-09: perubahan status sesi terbaru dari pengguna lain (null jika belum ada). */
export function usePerubahanSesi(): PerubahanSesi | null {
  return useSyncExternalStore(subscribe, snapshotPerubahan, snapshotPerubahan);
}

export function useSesiList(): Sesi[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

// CRUD sesi (FR-04) dan kontrol status (FR-05) langsung ke Firestore.
function pastikanAktif() {
  if (!sesiAktif()) throw new Error("Firebase belum dikonfigurasi. Periksa file .env.");
}

export async function tambahSesi(data: DataSesi): Promise<string> {
  pastikanAktif();
  return tambahSesiFS(data);
}

export async function ubahSesi(id: string, data: Partial<DataSesi>): Promise<void> {
  pastikanAktif();
  return ubahSesiFS(id, data);
}

export async function hapusSesi(id: string): Promise<void> {
  pastikanAktif();
  return hapusSesiFS(id);
}

/** FR-05: membuka sesi (divalidasi dengan transaksi di server). */
export async function bukaSesi(id: string, catatan?: string): Promise<void> {
  pastikanAktif();
  return bukaSesiFS(id, catatan);
}

/** FR-05: menutup sesi (divalidasi dengan transaksi di server). */
export async function tutupSesi(id: string): Promise<void> {
  pastikanAktif();
  return tutupSesiFS(id);
}


/**
 * FR-06: sesi berkaitan dengan praktikan jika kelas sesi sama dengan salah satu kelasnya
 * (dari profil atau keanggotaan laboratorium). Praktikan tanpa kelas tidak melihat sesi apa pun.
 */
export function sesiBerkaitan(sesi: Sesi, praktikan?: Pengguna): boolean {
  const daftar = praktikan?.kelasList?.length ? praktikan.kelasList : praktikan?.kelas ? [praktikan.kelas] : [];
  if (daftar.length === 0) return false;
  const kelasSesi = sesi.kelas.trim().toUpperCase();
  return daftar.some((k) => k.trim().toUpperCase() === kelasSesi);
}

/** FR-06: daftar sesi yang berkaitan dengan praktikan (real-time). */
export function useSesiPraktikan(praktikan?: Pengguna): Sesi[] {
  const semua = useSesiList();
  return useMemo(() => semua.filter((s) => sesiBerkaitan(s, praktikan)), [semua, praktikan]);
}

export function useSesi(id: string | undefined): Sesi | undefined {
  return useSesiList().find((s) => s.id === id);
}

/**
 * FR-08: rekap kehadiran sesi untuk asisten, dari catatan presensi nyata.
 * Status terlambat memakai tanda `terlambat` yang dihitung saat presensi (grace period laboratorium).
 */
export function getRekapSesi(sesiId: string, role: Role = "asisten"): BarisRekap[] {
  if (role !== "asisten" || !sesiId) return [];
  const sesi = sesiState.find((x) => x.id === sesiId);
  const mulai = sesi ? new Date(sesi.waktuMulai) : new Date();
  const batas = mulai.getHours() * 60 + mulai.getMinutes() + GRACE_BAWAAN_MENIT;
  return presensiStore
    .filter((p) => p.sesiId === sesiId)
    .map((p, i) => ({
      id: p.id ?? `n-${sesiId}-${i}`,
      nama: p.namaPraktikan,
      nim: p.nimPraktikan ?? "-",
      waktu: p.waktuKehadiran,
      status:
        typeof p.terlambat === "boolean"
          ? p.terlambat ? "TERLAMBAT" : "TEPAT_WAKTU"
          : menitDariWaktu(p.waktuKehadiran) <= batas ? "TEPAT_WAKTU" : "TERLAMBAT",
    }));
}

/** FR-08: hook real-time rekap kehadiran satu sesi (Firestore onSnapshot). */
export function useRekapSesi(sesiId: string | undefined, role: Role = "asisten"): BarisRekap[] {
  const version = useSyncExternalStore(subscribe, snapshotVersion, snapshotVersion);
  const presensiList = useSyncExternalStore(subscribePresensi, getPresensiSnapshot, getPresensiSnapshot);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !sesiId || role !== "asisten") return;
    const q = query(collection(db, COLLECTIONS.PRESENSI), where("sesiId", "==", sesiId));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let changed = false;
        snap.docChanges().forEach((change) => {
          const data = change.doc.data() as CatatanPresensi;
          const docId = change.doc.id || buatIdPresensi(data.sesiId, data.praktikanId);
          const idx = presensiStore.findIndex((p) => buatIdPresensi(p.sesiId, p.praktikanId) === docId);
          if (change.type === "removed") {
            if (idx !== -1) {
              presensiStore.splice(idx, 1);
              changed = true;
            }
            return;
          }
          if (idx === -1) presensiStore.unshift({ ...data, id: docId });
          else presensiStore[idx] = { ...presensiStore[idx], ...data, id: docId };
          changed = true;
        });
        if (changed) emitPresensi();
      },
      (err) => console.warn("[Firestore] Listener rekap sesi error:", err)
    );
    return () => unsubscribe();
  }, [sesiId, role]);

  return useMemo(() => {
    void version;
    void presensiList;
    if (!sesiId || role !== "asisten") return [];
    return getRekapSesi(sesiId, role);
  }, [sesiId, role, version, presensiList]);
}
