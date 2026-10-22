export interface CatatanPresensi {
  sesiId: string;
  namaSesi: string;
  kelas: string;
  praktikanId: string;
  namaPraktikan: string;
  tanggal: string; // contoh: "Kamis, 15 Okt 2026"
  waktuKehadiran: string; // contoh: "08:10:25"
  status: 'HADIR';
}

// In-memory store: data awal dummy riwayat presensi praktikan
export const presensiStore: CatatanPresensi[] = [
  {
    sesiId: 's-hist-1',
    namaSesi: 'Praktikum Algoritma & Pemrograman',
    kelas: 'IF-2B',
    praktikanId: 'u-2',
    namaPraktikan: 'Didi',
    tanggal: 'Kamis, 15 Okt 2026',
    waktuKehadiran: '08:05:12',
    status: 'HADIR',
  },
];

// Helper untuk menambah catatan presensi
export function catatPresensi(data: CatatanPresensi) {
  const sudahAda = presensiStore.some(
    (p) => p.sesiId === data.sesiId && p.praktikanId === data.praktikanId
  );
  if (!sudahAda) {
    presensiStore.unshift(data); // tambahkan paling depan agar presensi terbaru muncul pertama
  }
}

// Helper untuk mengecek apakah praktikan sudah presensi di sesi tertentu
export function cekSudahPresensi(sesiId: string, praktikanId: string): CatatanPresensi | undefined {
  return presensiStore.find(
    (p) => p.sesiId === sesiId && p.praktikanId === praktikanId
  );
}

// Helper untuk mengambil seluruh riwayat presensi praktikan tertentu
export function getRiwayatPraktikan(praktikanId: string): CatatanPresensi[] {
  return presensiStore.filter((p) => p.praktikanId === praktikanId);
}
