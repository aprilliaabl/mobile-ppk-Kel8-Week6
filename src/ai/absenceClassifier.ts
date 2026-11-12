import modelEdom from './model-edom.json';
import { createSentimentClassifier, type SentimentModel, type SentimentResult } from './sentiment';
import type { KategoriIzinAI, KlasifikasiAI } from '../constants/types';

let cachedClassifier: ((text: string) => SentimentResult) | null = null;

function getDefaultClassifier(): (text: string) => SentimentResult {
  if (!cachedClassifier) {
    cachedClassifier = createSentimentClassifier(modelEdom as unknown as SentimentModel);
  }
  return cachedClassifier;
}

function deteksiKategoriKonteks(teks: string): {
  kategori: KategoriIzinAI;
  rekomendasi: string;
  konteks: string;
} {
  const lower = teks.toLowerCase();

  if (
    /\b(sakit|demam|dokter|rawat|rs|rumah sakit|puskesmas|klinik|opname|flu|tipes|medis|kesehatan|kecelakaan|obat)\b/.test(
      lower
    )
  ) {
    return {
      kategori: 'SAKIT_MEDIS',
      rekomendasi: 'Direkomendasikan (Sakit / Medis)',
      konteks: 'Alasan berkaitan dengan kondisi kesehatan/medis praktikan.',
    };
  }

  if (
    /\b(duka|meninggal|keluarga|orang tua|ayah|ibu|nenek|kakek|darurat|musibah|bencana|banjir)\b/.test(
      lower
    )
  ) {
    return {
      kategori: 'DARURAT_KELUARGA',
      rekomendasi: 'Direkomendasikan (Darurat / Keluarga)',
      konteks: 'Alasan berkaitan dengan kondisi darurat atau urusan keluarga mendesak.',
    };
  }

  if (
    /\b(lomba|delegasi|kompetisi|dispensasi|seminar|konferensi|kampus|fakultas|jurusan|tugas kampus|kkn|kp|ujian)\b/.test(
      lower
    )
  ) {
    return {
      kategori: 'AKADEMIK_DISPENSASI',
      rekomendasi: 'Perlu Verifikasi Surat (Akademik / Dispensasi)',
      konteks: 'Alasan berkaitan dengan kegiatan akademik atau dispensasi institusi.',
    };
  }

  if (lower.trim().split(/\s+/).length >= 4) {
    return {
      kategori: 'KEPERLUAN_PRIBADI',
      rekomendasi: 'Pertimbangkan (Keperluan Pribadi)',
      konteks: 'Alasan keperluan pribadi; asisten dapat meninjau urgensi dan kelengkapan alasan.',
    };
  }

  return {
    kategori: 'PERLU_TINJAUAN',
    rekomendasi: 'Perlu Tinjauan Manual (Alasan Singkat)',
    konteks: 'Alasan terlalu singkat atau kurang spesifik; disarankan tinjauan manual asisten.',
  };
}

/**
 * FR-12: Mengklasifikasikan alasan izin menggunakan model AI LinearSVC yang ada di `src/ai/`.
 * Hasil klasifikasi murni digunakan sebagai referensi bagi asisten dan TIDAK pernah
 * menyetujui atau menolak pengajuan izin secara otomatis.
 * Jika terjadi kegagalan pada model AI, fungsi menangkap error dengan aman (graceful fallback).
 */
export function klasifikasikanAlasanIzin(
  alasan: string,
  customClassifier?: (text: string) => SentimentResult
): KlasifikasiAI {
  try {
    const runClassify = customClassifier ?? getDefaultClassifier();
    const raw = runClassify(alasan);
    const { kategori, rekomendasi, konteks } = deteksiKategoriKonteks(alasan);

    const toneLabel =
      raw.label === 'positif'
        ? 'Nada sopan/konstruktif (Positif)'
        : raw.label === 'netral'
        ? 'Nada informatif (Netral)'
        : raw.label === 'negatif'
        ? 'Nada keluhan/kurang formal (Negatif)'
        : 'Kosakata di luar baseline EDOM';

    return {
      label: raw.label ?? null,
      status: raw.status ?? 'unknown_vocabulary',
      scores: Array.isArray(raw.scores) ? raw.scores : null,
      scoreType: raw.scoreType ?? 'none',
      experimental: Boolean(raw.experimental),
      kategori,
      rekomendasi,
      catatanReferensi: `${konteks} • Analisis model AI: ${toneLabel}.`,
    };
  } catch {
    return {
      label: null,
      status: 'error',
      scores: null,
      scoreType: 'none',
      experimental: true,
      kategori: 'PERLU_TINJAUAN',
      rekomendasi: 'Perlu Tinjauan Manual (AI Tidak Tersedia)',
      catatanReferensi:
        'Klasifikasi otomatis mengalami kendala, namun pengajuan izin tetap tersimpan untuk ditinjau asisten.',
    };
  }
}
