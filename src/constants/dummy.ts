import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { COLLECTIONS, db, isFirebaseConfigured } from "../config/firebase";
import {
  buatIdPresensi,
  type CatatanPresensi,
  emitPresensi,
  getPresensiSnapshot,
  presensiStore,
  resetPresensiDemo,
  subscribePresensi,
} from './presensiStore';
import { resetIzinDemo } from './izinStore';
import type {
  BarisRekap,
  DataSesi,
  Role,
  Sesi,
  StatusSesi,
  UserDummy,
} from './types';

export const userDummy: UserDummy[] = [
  { id: "u-1", nama: "Dada", role: "asisten" },
  { id: "u-2", nama: "Didi", nim: "22/001", role: "praktikan" },
];

/** Waktu dibuat relatif terhadap hari ini supaya label "Hari ini / Besok" selalu relevan. */
function at(dayOffset: number, jam: number, menit: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(jam, menit, 0, 0);
  return d.toISOString();
}

function buatSesiAwal(): Sesi[] {
  return [
    {
      id: "s-1",
      nama: "Praktikum Struktur Data",
      kelas: "IF-2A",
      ruang: "Lab Komputer 1",
      waktuMulai: at(0, 8, 0),
      waktuSelesai: at(0, 10, 0),
      status: "belum_dibuka",
      jumlahPeserta: 25,
    },
    {
      id: "s-2",
      nama: "Praktikum Basis Data",
      kelas: "IF-2B",
      ruang: "Lab Komputer 3",
      waktuMulai: at(0, 10, 30),
      waktuSelesai: at(0, 12, 30),
      status: "dibuka",
      dibukaPada: at(0, 10, 28),
      jumlahPeserta: 24,
      catatan: "Bawa laptop dan charger. Modul 5 tentang JOIN.",
    },
    {
      id: "s-3",
      nama: "Praktikum Pemrograman Web",
      kelas: "IF-3A",
      ruang: "Lab Komputer 2",
      waktuMulai: at(-1, 8, 0),
      waktuSelesai: at(-1, 10, 0),
      status: "ditutup",
      dibukaPada: at(-1, 7, 58),
      ditutupPada: at(-1, 10, 2),
      jumlahPeserta: 22,
    },
    {
      id: "s-4",
      nama: "Praktikum Jaringan Komputer",
      kelas: "IF-3B",
      ruang: "Lab Jaringan",
      waktuMulai: at(1, 13, 0),
      waktuSelesai: at(1, 15, 0),
      status: "belum_dibuka",
      jumlahPeserta: 20,
    },
  ];
}

/** Daftar nama dummy untuk rekap asisten. */
const PRAKTIKAN_LAIN = [
  { nama: "Bella Safitri", nim: "22/002" },
  { nama: "Dimas Anggara", nim: "22/003" },
  { nama: "Eka Nur Wahyuni", nim: "22/004" },
  { nama: "Fajar Hidayat", nim: "22/005" },
  { nama: "Gita Permata", nim: "22/006" },
];

/** Data rekap dummy per sesi (selain presensi nyata yang dilakukan praktikan di aplikasi). */
type SeedRekap = { nama: string; nim: string; waktu: string };
const REKAP_DUMMY: Record<string, SeedRekap[]> = {
  "s-2": [
    { ...PRAKTIKAN_LAIN[0], waktu: "10.32.04" },
    { ...PRAKTIKAN_LAIN[1], waktu: "10.35.05" },
    { ...PRAKTIKAN_LAIN[2], waktu: "10.52.20" },
  ],
  "s-3": [
    { ...PRAKTIKAN_LAIN[0], waktu: "08.02.10" },
    { ...PRAKTIKAN_LAIN[1], waktu: "08.04.11" },
    { ...PRAKTIKAN_LAIN[3], waktu: "08.07.12" },
    { ...PRAKTIKAN_LAIN[4], waktu: "08.11.13" },
    { ...PRAKTIKAN_LAIN[2], waktu: "08.21.14" },
  ],
};

/** Praktikan dummy tambahan yang bisa "disimulasikan hadir" dari Dashboard Asisten. */
const POOL_SIMULASI = [
  { nama: "Joko Prasetyo", nim: "22/010" },
  { nama: "Kartika Dewi", nim: "22/011" },
  { nama: "Lukman Hakim", nim: "22/012" },
];
const rekapTambahan: Record<string, SeedRekap[]> = {};

function menitDariWaktu(w: string): number {
  const m = /(\d{1,2})[.:](\d{2})/.exec(w);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

// ---------- Store sederhana (di memori) supaya perubahan status sesi terlihat di semua layar ----------
let sesiState: Sesi[] = buatSesiAwal();
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

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
const snapshot = () => sesiState;
const snapshotVersion = () => rekapVersion;

export function useSesiList(): Sesi[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function useSesi(id: string | undefined): Sesi | undefined {
  return useSesiList().find((s) => s.id === id);
}

// CRUD sesi. Dibuat async agar nanti isinya tinggal diganti dengan Firestore tanpa mengubah pemanggil.
export async function tambahSesi(data: DataSesi): Promise<string> {
  const id = `s-${Date.now()}`;
  sesiState = [...sesiState, { id, status: "belum_dibuka", ...data }];
  emit();
  return id;
}

export async function ubahSesi(
  id: string,
  data: Partial<DataSesi>,
): Promise<void> {
  sesiState = sesiState.map((s) => (s.id === id ? { ...s, ...data } : s));
  emit();
}

export async function hapusSesi(id: string): Promise<void> {
  sesiState = sesiState.filter((s) => s.id !== id);
  emit();
}

/** FR-05: membuka sesi. Menolak jika sesi tidak ditemukan, sudah dibuka, atau sudah ditutup. */
export async function bukaSesi(id: string, catatan?: string): Promise<void> {
  const sesi = sesiState.find((s) => s.id === id);
  if (!sesi) throw new Error("Sesi tidak ditemukan.");
  if (sesi.status === "dibuka") throw new Error("Sesi ini sudah dibuka.");
  if (sesi.status === "ditutup")
    throw new Error("Sesi yang sudah ditutup tidak dapat dibuka kembali.");
  sesiState = sesiState.map((s) =>
    s.id === id
      ? {
          ...s,
          status: "dibuka" as StatusSesi,
          catatan: catatan?.trim() || undefined,
          dibukaPada: new Date().toISOString(),
        }
      : s,
  );
  emit();
}

/** FR-05: menutup sesi. Menolak jika sesi tidak ditemukan, belum dibuka, atau sudah ditutup. */
export async function tutupSesi(id: string): Promise<void> {
  const sesi = sesiState.find((s) => s.id === id);
  if (!sesi) throw new Error("Sesi tidak ditemukan.");
  if (sesi.status === "belum_dibuka")
    throw new Error("Sesi belum dibuka, jadi belum dapat ditutup.");
  if (sesi.status === "ditutup") throw new Error("Sesi ini sudah ditutup.");
  sesiState = sesiState.map((s) =>
    s.id === id
      ? {
          ...s,
          status: "ditutup" as StatusSesi,
          ditutupPada: new Date().toISOString(),
        }
      : s,
  );
  emit();
}

/**
 * FR-08: Gabungan rekap kehadiran sesi untuk asisten.
 * Pengguna selain asisten tidak diizinkan mengakses data rekap kehadiran asisten.
 */
export function getRekapSesi(
  sesiId: string,
  role: Role = "asisten",
): BarisRekap[] {
  if (role !== "asisten" || !sesiId) {
    return [];
  }
  const sesi = sesiState.find((x) => x.id === sesiId);
  const mulai = sesi ? new Date(sesi.waktuMulai) : new Date();
  const batas = mulai.getHours() * 60 + mulai.getMinutes() + 15;

  const semua: { id: string; nama: string; nim: string; waktu: string }[] = [
    ...(REKAP_DUMMY[sesiId] ?? []).map((p, i) => ({
      id: `d-${sesiId}-${i}`,
      ...p,
    })),
    ...(rekapTambahan[sesiId] ?? []).map((p, i) => ({
      id: `sim-${sesiId}-${i}`,
      ...p,
    })),
    ...presensiStore
      .filter((p) => p.sesiId === sesiId)
      .map((p, i) => ({
        id: p.id ?? `n-${sesiId}-${i}`,
        nama: p.namaPraktikan,
        nim: p.nimPraktikan ?? "22/001",
        waktu: p.waktuKehadiran,
      })),
  ];
  return semua.map((p) => ({
    ...p,
    status: menitDariWaktu(p.waktu) <= batas ? "TEPAT_WAKTU" : "TERLAMBAT",
  }));
}

/**
 * FR-08: Hook real-time untuk memantau rekap kehadiran suatu sesi.
 * Menggunakan Firestore onSnapshot (jika terkonfigurasi) serta store subscription
 * sehingga rekap asisten otomatis ter-update saat praktikan submit presensi tanpa refresh manual.
 */
export function useRekapSesi(
  sesiId: string | undefined,
  role: Role = "asisten",
): BarisRekap[] {
  const version = useSyncExternalStore(
    subscribe,
    snapshotVersion,
    snapshotVersion,
  );
  const presensiList = useSyncExternalStore(
    subscribePresensi,
    getPresensiSnapshot,
    getPresensiSnapshot,
  );

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !sesiId || role !== "asisten") return;
    const q = query(
      collection(db, COLLECTIONS.PRESENSI),
      where("sesiId", "==", sesiId),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let changed = false;
        snap.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const data = change.doc.data() as CatatanPresensi;
            const docId =
              change.doc.id || buatIdPresensi(data.sesiId, data.praktikanId);
            const idx = presensiStore.findIndex(
              (p) => buatIdPresensi(p.sesiId, p.praktikanId) === docId,
            );
            if (idx === -1) {
              presensiStore.unshift({ ...data, id: docId });
              changed = true;
            } else {
              presensiStore[idx] = {
                ...presensiStore[idx],
                ...data,
                id: docId,
              };
              changed = true;
            }
          }
        });
        if (changed) emitPresensi();
      },
      (err) => {
        console.warn("[Firestore] Listener rekap sesi error:", err);
      },
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

/** Simulasi: menambahkan satu praktikan dummy hadir ke sesi yang sedang dibuka. Mengembalikan false jika habis. */
export function simulasiPresensi(sesiId: string): boolean {
  const sesi = sesiState.find((x) => x.id === sesiId);
  if (!sesi || sesi.status !== "dibuka") return false;
  const sudah = rekapTambahan[sesiId] ?? [];
  if (sudah.length >= POOL_SIMULASI.length) return false;
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const waktu = `${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
  rekapTambahan[sesiId] = [...sudah, { ...POOL_SIMULASI[sudah.length], waktu }];
  emit();
  return true;
}

export const sisaSimulasi = (sesiId: string) =>
  POOL_SIMULASI.length - (rekapTambahan[sesiId]?.length ?? 0);

export function resetDemo() {
  sesiState = buatSesiAwal();
  Object.keys(rekapTambahan).forEach((k) => delete rekapTambahan[k]);
  resetPresensiDemo();
  resetIzinDemo();
  emit();
}
