import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Sesi, StatusSesi } from './types';

/**
 * FR-10: salinan daftar sesi di penyimpanan perangkat.
 * Dipakai agar jadwal langsung tampil saat aplikasi dibuka kembali, bahkan sebelum (atau tanpa) koneksi ke server.
 * Sumber kebenaran tetap Firestore. Cache ini hanya cadangan tampilan.
 */
const KUNCI = 'cache:sesi:v1';
const STATUS_VALID: StatusSesi[] = ['belum_dibuka', 'dibuka', 'ditutup'];

let terakhirDisimpan = '';

export async function simpanCacheSesi(daftar: Sesi[]): Promise<void> {
  try {
    const isi = JSON.stringify(daftar);
    if (isi === terakhirDisimpan) return; // tidak ada perubahan, hindari tulis ulang
    await AsyncStorage.setItem(KUNCI, JSON.stringify({ disimpanPada: Date.now(), daftar }));
    terakhirDisimpan = isi;
  } catch {
    // Gagal menyimpan cache tidak boleh mengganggu aplikasi.
  }
}

function sesiValid(x: unknown): x is Sesi {
  if (!x || typeof x !== 'object') return false;
  const s = x as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.nama === 'string' &&
    typeof s.kelas === 'string' &&
    typeof s.ruang === 'string' &&
    typeof s.waktuMulai === 'string' &&
    typeof s.waktuSelesai === 'string' &&
    typeof s.jumlahPeserta === 'number' &&
    STATUS_VALID.includes(s.status as StatusSesi)
  );
}

/** Membaca cache. Mengembalikan null jika belum ada atau isinya rusak. */
export async function bacaCacheSesi(): Promise<Sesi[] | null> {
  try {
    const mentah = await AsyncStorage.getItem(KUNCI);
    if (!mentah) return null;
    const j = JSON.parse(mentah) as { daftar?: unknown };
    if (!Array.isArray(j.daftar)) return null;
    return j.daftar.filter(sesiValid);
  } catch {
    return null;
  }
}

/** Menghapus cache, mis. saat pengguna logout agar data tidak terlihat oleh akun berikutnya. */
export async function hapusCacheSesi(): Promise<void> {
  terakhirDisimpan = '';
  try {
    await AsyncStorage.removeItem(KUNCI);
  } catch {
    // diabaikan
  }
}
