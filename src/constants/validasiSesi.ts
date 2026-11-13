import { DataSesi, Sesi } from './types';

export interface FormSesiValues {
  nama: string;
  kelas: string;
  ruang: string;
  tanggal: string; // YYYY-MM-DD
  jamMulai: string; // HH:MM
  jamSelesai: string; // HH:MM
  jumlahPeserta: string;
}

export type ErrorSesi = Partial<Record<keyof FormSesiValues, string>>;

const pad = (n: number) => n.toString().padStart(2, '0');

/** Menggabungkan "2026-11-20" + "08:30" menjadi Date, atau null jika format salah. */
export function gabungWaktu(tanggal: string, jam: string): Date | null {
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggal.trim());
  const j = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(jam.trim());
  if (!t || !j) return null;
  const d = new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3]), Number(j[1]), Number(j[2]), 0, 0);
  // Tolak tanggal yang tidak ada, mis. 2026-02-31
  if (d.getFullYear() !== Number(t[1]) || d.getMonth() !== Number(t[2]) - 1 || d.getDate() !== Number(t[3])) return null;
  return d;
}

export function validasiSesi(v: FormSesiValues): ErrorSesi {
  const e: ErrorSesi = {};
  if (v.nama.trim().length < 3) e.nama = 'Nama praktikum minimal 3 karakter.';
  if (!v.kelas.trim()) e.kelas = 'Kelas wajib diisi, contoh: IF-2B.';
  if (!v.ruang.trim()) e.ruang = 'Ruang wajib diisi.';

  if (!gabungWaktu(v.tanggal, '00:00')) e.tanggal = 'Gunakan tanggal yang valid dengan format YYYY-MM-DD, contoh: 2026-11-20.';

  const JAM = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!JAM.test(v.jamMulai.trim())) e.jamMulai = 'Gunakan format jam HH:MM, contoh: 08:30.';
  if (!JAM.test(v.jamSelesai.trim())) e.jamSelesai = 'Gunakan format jam HH:MM, contoh: 10:30.';
  if (!e.tanggal && !e.jamMulai && !e.jamSelesai) {
    const mulai = gabungWaktu(v.tanggal, v.jamMulai)!;
    const selesai = gabungWaktu(v.tanggal, v.jamSelesai)!;
    if (selesai <= mulai) e.jamSelesai = 'Jam selesai harus setelah jam mulai.';
  }

  const n = Number(v.jumlahPeserta);
  if (!v.jumlahPeserta.trim() || !Number.isInteger(n) || n <= 0 || n > 500) {
    e.jumlahPeserta = 'Jumlah peserta harus bilangan bulat antara 1 dan 500.';
  }
  return e;
}

/** Mengubah isi form (yang sudah valid) menjadi data sesi. */
export function keDataSesi(v: FormSesiValues): DataSesi {
  return {
    nama: v.nama.trim(),
    kelas: v.kelas.trim().toUpperCase(),
    ruang: v.ruang.trim(),
    waktuMulai: gabungWaktu(v.tanggal, v.jamMulai)!.toISOString(),
    waktuSelesai: gabungWaktu(v.tanggal, v.jamSelesai)!.toISOString(),
    jumlahPeserta: Number(v.jumlahPeserta),
  };
}

export function formKosong(): FormSesiValues {
  const d = new Date();
  return {
    nama: '',
    kelas: '',
    ruang: '',
    tanggal: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    jamMulai: '',
    jamSelesai: '',
    jumlahPeserta: '',
  };
}

export function dariSesi(s: Sesi): FormSesiValues {
  const m = new Date(s.waktuMulai);
  const a = new Date(s.waktuSelesai);
  return {
    nama: s.nama,
    kelas: s.kelas,
    ruang: s.ruang,
    tanggal: `${m.getFullYear()}-${pad(m.getMonth() + 1)}-${pad(m.getDate())}`,
    jamMulai: `${pad(m.getHours())}:${pad(m.getMinutes())}`,
    jamSelesai: `${pad(a.getHours())}:${pad(a.getMinutes())}`,
    jumlahPeserta: String(s.jumlahPeserta),
  };
}
