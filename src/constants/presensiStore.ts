export interface CatatanPresensi {
  sesiId: string;
  namaSesi: string;
  kelas: string;
  praktikanId: string;
  namaPraktikan: string;
  waktuKehadiran: string; // contoh: "12:15:30"
  status: 'HADIR';
}

// In-memory store: data tetap bertahan meskipun halaman ditutup/pindah rute
export const presensiStore: CatatanPresensi[] = [];

// Helper untuk menambah catatan presensi
export function catatPresensi(data: CatatanPresensi) {
  const sudahAda = presensiStore.some(
    (p) => p.sesiId === data.sesiId && p.praktikanId === data.praktikanId
  );
  if (!sudahAda) {
    presensiStore.unshift(data); // tambahkan paling depan
  }
}

// Helper untuk mengecek apakah praktikan sudah presensi di sesi tertentu
export function cekSudahPresensi(sesiId: string, praktikanId: string): CatatanPresensi | undefined {
  return presensiStore.find(
    (p) => p.sesiId === sesiId && p.praktikanId === praktikanId
  );
}
