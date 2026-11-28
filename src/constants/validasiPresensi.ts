import { cariLaboratoriumSesi, hitungJarakMeter } from './laboratorium';
import type { InfoLokasiPresensi } from './presensiStore';
import type { Laboratorium, Sesi, Pengguna } from './types';

export type StatusLokasiPerangkat =
  | 'idle'
  | 'memuat'
  | 'izin_ditolak'
  | 'gps_mati'
  | 'akurasi_buruk'
  | 'mock_terdeteksi'
  | 'gagal'
  | 'berhasil';

export interface KoordinatPerangkat {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  mocked?: boolean;
  timestamp?: number;
}

export interface HasilPemeriksaanLokasi {
  status: StatusLokasiPerangkat;
  koordinat: KoordinatPerangkat | null;
  laboratorium: Laboratorium | undefined;
  jarakMeter: number | null;
  dalamRadius: boolean;
  pesan: string;
  infoLokasiPresensi?: InfoLokasiPresensi;
}

export interface HasilValidasiPresensiLengkap {
  bolehPresensi: boolean;
  sesiValid: boolean;
  pesanSesi: string;
  lokasiValid: boolean;
  pesanLokasi: string;
  belumPresensi: boolean;
  pesanPresensi: string;
  userValid: boolean;
  pesanUser: string;
  ringkasanError: string | null;
  hasilLokasi: HasilPemeriksaanLokasi;
}

/** Batas toleransi akurasi GPS maksimum (meter) agar lokasi dianggap layak */
export const BATAS_AKURASI_GPS_METER = 150;

/**
 * Mengevaluasi hasil pembacaan lokasi perangkat terhadap laboratorium tempat sesi berlangsung.
 */
export function evaluasiLokasiTerhadapLab(params: {
  statusLokasi: StatusLokasiPerangkat;
  koordinat: KoordinatPerangkat | null;
  sesi: Pick<Sesi, 'ruang' | 'laboratoriumId'> | undefined;
  daftarLab?: Laboratorium[];
  errorDetail?: string | null;
}): HasilPemeriksaanLokasi {
  const { statusLokasi, koordinat, sesi, daftarLab, errorDetail } = params;
  const lab = cariLaboratoriumSesi(sesi, daftarLab);

  if (statusLokasi === 'izin_ditolak') {
    return {
      status: 'izin_ditolak',
      koordinat: null,
      laboratorium: lab,
      jarakMeter: null,
      dalamRadius: false,
      pesan: 'Permission lokasi belum diberikan.',
    };
  }

  if (statusLokasi === 'gps_mati') {
    return {
      status: 'gps_mati',
      koordinat: null,
      laboratorium: lab,
      jarakMeter: null,
      dalamRadius: false,
      pesan: 'Lokasi perangkat tidak dapat diperoleh. Aktifkan layanan lokasi / GPS perangkat.',
    };
  }

  if (statusLokasi === 'memuat' || statusLokasi === 'idle') {
    return {
      status: statusLokasi,
      koordinat: null,
      laboratorium: lab,
      jarakMeter: null,
      dalamRadius: false,
      pesan: 'Sedang memeriksa lokasi perangkat...',
    };
  }

  if (statusLokasi === 'gagal' || !koordinat) {
    return {
      status: 'gagal',
      koordinat: null,
      laboratorium: lab,
      jarakMeter: null,
      dalamRadius: false,
      pesan: errorDetail || 'Lokasi perangkat tidak dapat diperoleh.',
    };
  }

  if (koordinat.mocked) {
    return {
      status: 'mock_terdeteksi',
      koordinat,
      laboratorium: lab,
      jarakMeter: null,
      dalamRadius: false,
      pesan: 'Terdeteksi lokasi palsu (Mock GPS). Matikan aplikasi Fake GPS untuk melakukan presensi.',
    };
  }

  if (
    typeof koordinat.accuracy === 'number' &&
    koordinat.accuracy > BATAS_AKURASI_GPS_METER
  ) {
    return {
      status: 'akurasi_buruk',
      koordinat,
      laboratorium: lab,
      jarakMeter: null,
      dalamRadius: false,
      pesan: `Akurasi lokasi kurang baik (±${Math.round(koordinat.accuracy)}m). Pindah ke area dengan sinyal GPS lebih stabil lalu segarkan lokasi.`,
    };
  }

  if (!lab) {
    return {
      status: 'gagal',
      koordinat,
      laboratorium: undefined,
      jarakMeter: null,
      dalamRadius: false,
      pesan: `Koordinat laboratorium untuk ruang "${sesi?.ruang ?? '-'}" belum terdaftar.`,
    };
  }

  const jarakMeter = hitungJarakMeter(
    koordinat.latitude,
    koordinat.longitude,
    lab.latitude,
    lab.longitude
  );
  const dalamRadius = jarakMeter <= lab.radius;

  const infoLokasiPresensi: InfoLokasiPresensi = {
    latitude: koordinat.latitude,
    longitude: koordinat.longitude,
    accuracy: koordinat.accuracy ?? null,
    jarakMeter,
    radiusMeter: lab.radius,
    labId: lab.id,
    namaLab: lab.nama,
  };

  return {
    status: 'berhasil',
    koordinat,
    laboratorium: lab,
    jarakMeter,
    dalamRadius,
    pesan: dalamRadius
      ? `Lokasi berada dalam radius laboratorium (${jarakMeter}m dari maks. ${lab.radius}m).`
      : `Lokasi berada di luar radius laboratorium (${jarakMeter}m dari batas radius ${lab.radius}m).`,
    infoLokasiPresensi,
  };
}

/**
 * FR-18: Memvalidasi seluruh syarat presensi secara komprehensif:
 * 1. Sesi sedang dibuka
 * 2. Lokasi berada dalam radius laboratorium
 * 3. Pengguna belum melakukan presensi untuk sesi tersebut
 * 4. Pengguna terautentikasi sebagai praktikan
 */
export function validasiSyaratPresensi(params: {
  sesi: Sesi | undefined;
  praktikan: Pengguna | undefined;
  sudahPresensi: boolean;
  waktuHadir?: string | null;
  statusLokasi: StatusLokasiPerangkat;
  koordinat: KoordinatPerangkat | null;
  daftarLab?: Laboratorium[];
  errorLokasiDetail?: string | null;
}): HasilValidasiPresensiLengkap {
  const {
    sesi,
    praktikan,
    sudahPresensi,
    waktuHadir,
    statusLokasi,
    koordinat,
    daftarLab,
    errorLokasiDetail,
  } = params;

  // 0. Validasi User
  const userValid =
    !!praktikan && !!praktikan.id?.trim() && praktikan.role === 'praktikan';
  const pesanUser = userValid
    ? `Terautentikasi sebagai ${praktikan.nama}`
    : 'User tidak terautentikasi sebagai praktikan.';

  // 1. Validasi Sesi
  let sesiValid = false;
  let pesanSesi = 'Sesi praktikum tidak ditemukan.';
  if (sesi) {
    if (sesi.status === 'dibuka') {
      sesiValid = true;
      pesanSesi = 'Sesi sedang dibuka dan mengizinkan presensi.';
    } else if (sesi.status === 'belum_dibuka') {
      sesiValid = false;
      pesanSesi = 'Sesi belum dibuka.';
    } else {
      sesiValid = false;
      pesanSesi = 'Sesi sudah ditutup.';
    }
  }

  // 2. Validasi Lokasi
  const hasilLokasi = evaluasiLokasiTerhadapLab({
    statusLokasi,
    koordinat,
    sesi,
    daftarLab,
    errorDetail: errorLokasiDetail,
  });
  const lokasiValid =
    hasilLokasi.status === 'berhasil' && hasilLokasi.dalamRadius;
  const pesanLokasi = hasilLokasi.pesan;

  // 3. Validasi Kehadiran (Anti-Duplikasi)
  const belumPresensi = !sudahPresensi;
  const pesanPresensi = sudahPresensi
    ? `Pengguna sudah melakukan presensi${waktuHadir ? ` pada pukul ${waktuHadir} WIB` : ''}.`
    : 'Belum melakukan presensi pada sesi ini.';

  const bolehPresensi =
    userValid && sesiValid && lokasiValid && belumPresensi;

  let ringkasanError: string | null = null;
  if (!userValid) {
    ringkasanError = pesanUser;
  } else if (!belumPresensi) {
    ringkasanError = pesanPresensi;
  } else if (!sesiValid) {
    ringkasanError = pesanSesi;
  } else if (!lokasiValid) {
    ringkasanError = pesanLokasi;
  }

  return {
    bolehPresensi,
    sesiValid,
    pesanSesi,
    lokasiValid,
    pesanLokasi,
    belumPresensi,
    pesanPresensi,
    userValid,
    pesanUser,
    ringkasanError,
    hasilLokasi,
  };
}
