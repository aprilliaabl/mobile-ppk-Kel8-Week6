export type StatusSesi = "belum_dibuka" | "dibuka" | "ditutup";

export interface Sesi {
  id: string;
  nama: string;
  kelas: string;
  ruang: string;
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

export interface UserDummy {
  id: string;
  nama: string;
  nim?: string;
  role: Role;
}

/** Satu baris rekap kehadiran yang ditampilkan asisten. */
export interface BarisRekap {
  id: string;
  nama: string;
  nim: string;
  waktu: string; // contoh: "10.32.15"
  /** Terlambat jika hadir lebih dari 15 menit setelah sesi dimulai. */
  status: "TEPAT_WAKTU" | "TERLAMBAT";
}

export type StatusIzin = "pending" | "disetujui" | "ditolak";

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
  tanggalPengajuan: string;
  waktuPengajuan: string;
  createdAtIso: string;
}

/** Data yang diisi asisten pada form tambah/ubah sesi. */
export type DataSesi = Pick<
  Sesi,
  "nama" | "kelas" | "ruang" | "waktuMulai" | "waktuSelesai" | "jumlahPeserta"
>;
