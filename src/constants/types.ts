
export type StatusSesi = "belum_dibuka" | "dibuka" | "ditutup";

export interface Laboratorium {
  id: string;
  nama: string;
  kode: string;
  gedung: string;
  lantai?: number | string;
  latitude: number;
  longitude: number;
  radius: number; // radius geofence dalam meter (default: 10)
  gracePeriodMinutes: number; // toleransi keterlambatan dalam menit (default: 15)
  nominalDenda?: number; // nominal denda per keterlambatan dalam Rupiah (default: 10000)
  deskripsi?: string;
  mataKuliah?: string;
  createdAtIso?: string;
}

export type DataLaboratorium = Omit<Laboratorium, 'id' | 'createdAtIso'>;

export interface Sesi {
  id: string;
  nama: string;
  kelas: string;
  ruang: string;
  laboratoriumId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  gracePeriodMenit?: number; // durasi toleransi menit untuk sesi ini (FR-02 & FR-14)
  nominalDenda?: number; // nominal denda tetap untuk sesi ini (FR-15)
  waktuMulai: string;
  waktuSelesai: string;
  status: StatusSesi;
  jumlahPeserta: number;
  /** Pesan dari asisten yang diisi saat membuka sesi. */
  catatan?: string;
  /** Waktu sesi dibuka / ditutup oleh asisten (ISO). */
  dibukaPada?: string;
  ditutupPada?: string;
}

export type Role = "asisten" | "praktikan";

/** Profil pengguna yang sedang login untuk salah satu peran aktifnya. */
export interface Pengguna {
  id: string;
  nama: string;
  email?: string;
  nim?: string;
  /** Kelas utama (dari profil atau keanggotaan laboratorium pertama). */
  kelas?: string;
  /** Semua kelas tempat pengguna terdaftar sebagai praktikan. */
  kelasList?: string[];
  role: Role;
}

/** Alias lama agar kode yang masih memakai nama ini tetap kompatibel. */
export type UserDummy = Pengguna;

/** Keanggotaan seseorang pada sebuah laboratorium (praktikan atau asprak). */
export interface Anggota {
  /** `${laboratoriumId}_${userId}` */
  id: string;
  userId: string;
  laboratoriumId: string;
  nim: string;
  nama: string;
  kelas: string;
  role: Role;
}

export type StatusKehadiranPresensi =
  | 'TEPAT_WAKTU'
  | 'TERLAMBAT'
  | 'IZIN_TERKONFIRMASI';

export type StatusTagihanDenda =
  | 'BELUM_DIBAYAR'
  | 'PENDING'
  | 'LUNAS'
  | 'DIBEBASKAN';

export interface TagihanDenda {
  /** Deterministic ID: `denda_${sesiId}_${praktikanId}` */
  id: string;
  praktikanId: string;
  namaPraktikan: string;
  nimPraktikan?: string;
  sesiId: string;
  namaSesi: string;
  kelas: string;
  presensiId?: string;
  nominal: number;
  status: StatusTagihanDenda;
  alasan: string;
  menitKeterlambatan: number;
  tanggalTagihan: string;
  createdAtIso: string;
  dibayarPada?: string;
  orderIdMidtrans?: string;
  snapToken?: string;
}

/** Satu baris rekap kehadiran yang ditampilkan asisten. */
export interface BarisRekap {
  id: string;
  nama: string;
  nim: string;
  waktu: string;
  /** Terlambat jika hadir lebih dari grace period setelah sesi dimulai. */
  status: "TEPAT_WAKTU" | "TERLAMBAT";
  menitKeterlambatan?: number;
  tagihanDendaId?: string;
}

export type StatusIzin = "pending" | "disetujui" | "ditolak";

export type KategoriIzinAI =
  | 'SAKIT_MEDIS'
  | 'DARURAT_KELUARGA'
  | 'AKADEMIK_DISPENSASI'
  | 'KEPERLUAN_PRIBADI'
  | 'PERLU_TINJAUAN';

export interface KlasifikasiAI {
  /** Label asli dari model LinearSVC (src/ai/model-edom.json) */
  label: 'positif' | 'netral' | 'negatif' | null;
  /** Status inferensi dari src/ai/sentiment.js */
  status: 'predicted' | 'unknown_vocabulary' | 'empty_input' | 'error';
  /** Skor margin keputusan [negatif, netral, positif] */
  scores: number[] | null;
  scoreType: string;
  experimental: boolean;
  /** Kategori konteks alasan sebagai referensi bagi asisten */
  kategori: KategoriIzinAI;
  /** Ringkasan rekomendasi AI (hanya referensi, tidak mengubah status izin) */
  rekomendasi: string;
  /** Catatan penjelasan hasil klasifikasi untuk asisten */
  catatanReferensi: string;
}

export interface PengajuanIzin {
  /** Deterministic ID: `${sesiId}_${praktikanId}` */
  id: string;
  sesiId: string;
  namaSesi: string;
  kelas: string;
  praktikanId: string;
  namaPraktikan: string;
  nimPraktikan: string;
  alasan: string;
  status: StatusIzin;
  klasifikasiAI?: KlasifikasiAI;
  tanggalPengajuan: string;
  waktuPengajuan: string;
  createdAtIso: string;
  diprosesOleh?: string;
  diprosesPada?: string;
}

/** Data yang diisi asisten pada form tambah/ubah sesi. */
export type DataSesi = Pick<
  Sesi,
  | "nama"
  | "kelas"
  | "ruang"
  | "waktuMulai"
  | "waktuSelesai"
  | "jumlahPeserta"
  | "laboratoriumId"
  | "latitude"
  | "longitude"
  | "radius"
>;