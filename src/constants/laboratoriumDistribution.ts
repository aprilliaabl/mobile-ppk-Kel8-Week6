/**
 * SRS 2 — Distribusi laboratorium & bulk import (FR-03 s.d. FR-06).
 * Seluruh logika templat, validasi, dan penulisan Firestore ada di sini; layar hanya menampilkan.
 */
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
  type WriteBatch,
} from 'firebase/firestore';
import { COLLECTIONS, db } from '../config/firebase';
import { bacaRoles } from '../contexts/AuthContext';
import { normalkanKodeLab } from './laboratoriumStore';
import type { Anggota, Laboratorium, Role } from './types';

export type JenisImpor = 'laboratorium' | 'praktikan' | 'asprak';

export interface ImportRow {
  id: string;
  rowNumber: number;
  values: Record<string, string>;
  errors: string[];
  warnings: string[];
  status: 'review' | 'accepted' | 'rejected';
}

export interface ProfilUser {
  uid: string;
  nama: string;
  nim: string;
  email: string;
  roles: Role[];
}

/** Data pembanding untuk validasi (duplikasi terhadap data yang sudah ada di Firestore). */
export interface KonteksValidasi {
  labs: Laboratorium[];
  anggota: Anggota[];
  users: ProfilUser[];
}

export interface HasilBaris {
  rowId: string;
  ok: boolean;
  message: string;
}

/* ------------------------------------------------------------------ */
/* KOLOM & TEMPLAT (FR-06)                                             */
/* ------------------------------------------------------------------ */

export const KOLOM: Record<JenisImpor, { key: string; label: string; wajib: boolean }[]> = {
  laboratorium: [
    { key: 'kode', label: 'Kode', wajib: true },
    { key: 'nama', label: 'Nama', wajib: true },
    { key: 'gedung', label: 'Gedung', wajib: true },
    { key: 'lantai', label: 'Lantai', wajib: false },
    { key: 'latitude', label: 'Latitude', wajib: true },
    { key: 'longitude', label: 'Longitude', wajib: true },
    { key: 'radius', label: 'Radius (m)', wajib: true },
    { key: 'graceperiodminutes', label: 'Grace (menit)', wajib: false },
    { key: 'deskripsi', label: 'Deskripsi', wajib: false },
  ],
  praktikan: [
    { key: 'nim', label: 'NIM', wajib: true },
    { key: 'nama', label: 'Nama', wajib: true },
    { key: 'kelas', label: 'Kelas', wajib: true },
    { key: 'laboratoriumkode', label: 'Kode Lab', wajib: true },
  ],
  asprak: [
    { key: 'nim', label: 'NIM', wajib: true },
    { key: 'nama', label: 'Nama', wajib: true },
    { key: 'kelas', label: 'Kelas', wajib: false },
    { key: 'laboratoriumkode', label: 'Kode Lab', wajib: true },
  ],
};

const HEADER_ASLI: Record<JenisImpor, string[]> = {
  laboratorium: ['kode', 'nama', 'gedung', 'lantai', 'latitude', 'longitude', 'radius', 'gracePeriodMinutes', 'deskripsi'],
  praktikan: ['nim', 'nama', 'kelas', 'laboratoriumKode'],
  asprak: ['nim', 'nama', 'kelas', 'laboratoriumKode'],
};

const CONTOH: Record<JenisImpor, string> = {
  laboratorium: 'LAB-01,Lab Pemrograman,Gedung E,2,-7.047909,110.440866,25,15,Laboratorium praktikum',
  praktikan: '24060123140001,Didi Pratama,IF-2B,LAB-01',
  asprak: '24060122140010,Siti Aminah,IF-2B,LAB-01',
};

export const NAMA_TEMPLAT: Record<JenisImpor, string> = {
  laboratorium: 'template-laboratorium.csv',
  praktikan: 'template-praktikan.csv',
  asprak: 'template-asprak.csv',
};

/** FR-06: templat unduhan terpisah untuk laboratorium, praktikan, dan asprak. */
export function buatTemplatCSV(jenis: JenisImpor): string {
  return `${HEADER_ASLI[jenis].join(',')}\n${CONTOH[jenis]}\n`;
}

/* ------------------------------------------------------------------ */
/* PARSER CSV                                                          */
/* ------------------------------------------------------------------ */

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^\uFEFF/, '');
  // Deteksi pemisah: titik koma (Excel regional Indonesia) atau koma.
  const baris1 = src.split(/\r?\n/)[0] ?? '';
  const sep = (baris1.match(/;/g)?.length ?? 0) > (baris1.match(/,/g)?.length ?? 0) ? ';' : ',';

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

const normalHeader = (h: string) => h.trim().toLowerCase().replace(/[\s_-]+/g, '');

export class GalatImpor extends Error {}

/** Mengubah isi CSV menjadi baris impor. Header wajib sesuai templat jenisnya. */
export function bacaBarisImpor(text: string, jenis: JenisImpor): ImportRow[] {
  const tabel = parseCSV(text);
  if (tabel.length < 2) throw new GalatImpor('File kosong atau hanya berisi header.');
  const header = tabel[0].map(normalHeader);
  const wajib = KOLOM[jenis].filter((k) => k.wajib).map((k) => k.key);
  const hilang = wajib.filter((k) => !header.includes(k));
  if (hilang.length > 0) {
    throw new GalatImpor(`Header tidak sesuai templat ${jenis}. Kolom wajib yang hilang: ${hilang.join(', ')}.`);
  }
  if (tabel.length - 1 > 500) throw new GalatImpor('Maksimal 500 baris per file.');

  const kunciValid = new Set(KOLOM[jenis].map((k) => k.key));
  return tabel.slice(1).map((cells, i) => {
    const values: Record<string, string> = {};
    for (const k of kunciValid) values[k] = '';
    header.forEach((h, idx) => {
      const key = h === 'graceperiod' ? 'graceperiodminutes' : h;
      if (kunciValid.has(key)) values[key] = (cells[idx] ?? '').trim();
    });
    return {
      id: `r${i + 2}`,
      rowNumber: i + 2,
      values,
      errors: [],
      warnings: [],
      status: 'review' as const,
    };
  });
}

/* ------------------------------------------------------------------ */
/* VALIDASI (FR-06) — format, kelengkapan, duplikasi                   */
/* ------------------------------------------------------------------ */

const angka = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')));

/** Validasi satu baris. `lain` = baris lain dalam file yang sama (untuk duplikasi internal). */
export function validasiBaris(
  row: ImportRow,
  jenis: JenisImpor,
  konteks: KonteksValidasi,
  lain: ImportRow[]
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const v = row.values;

  for (const k of KOLOM[jenis]) {
    if (k.wajib && !v[k.key]?.trim()) errors.push(`${k.label} wajib diisi.`);
  }
  // Baris lain yang masih dipertimbangkan (bukan yang ditolak) dan muncul lebih dulu.
  const sebelumnya = lain.filter((r) => r.id !== row.id && r.rowNumber < row.rowNumber && r.status !== 'rejected');

  if (jenis === 'laboratorium') {
    const kode = normalkanKodeLab(v.kode ?? '');
    if (kode && !/^[A-Z0-9-]{2,20}$/.test(kode)) errors.push('Kode hanya boleh huruf, angka, dan tanda hubung (2-20 karakter).');
    if (kode) {
      if (konteks.labs.some((l) => normalkanKodeLab(l.kode) === kode)) errors.push(`Kode ${kode} sudah dipakai laboratorium lain.`);
      if (sebelumnya.some((r) => normalkanKodeLab(r.values.kode ?? '') === kode)) errors.push(`Kode ${kode} ganda di dalam file.`);
    }
    const lat = angka(v.latitude ?? '');
    const lng = angka(v.longitude ?? '');
    if (v.latitude && (!Number.isFinite(lat) || lat < -90 || lat > 90)) errors.push('Latitude harus angka antara -90 dan 90.');
    if (v.longitude && (!Number.isFinite(lng) || lng < -180 || lng > 180)) errors.push('Longitude harus angka antara -180 dan 180.');
    const radius = angka(v.radius ?? '');
    if (v.radius && (!Number.isFinite(radius) || radius <= 0 || radius > 1000)) errors.push('Radius harus lebih dari 0 dan maksimal 1000 meter.');
    if (v.graceperiodminutes) {
      const g = angka(v.graceperiodminutes);
      if (!Number.isInteger(g) || g < 0 || g > 120) errors.push('Grace period harus bilangan bulat 0-120 menit.');
    } else warnings.push('Grace period kosong, dipakai 15 menit.');
    if (v.lantai) {
      const l = angka(v.lantai);
      if (!Number.isInteger(l) || l < 1) errors.push('Lantai harus bilangan bulat minimal 1.');
    }
    if (kode && konteks.labs.length > 0) {
      const dekat = konteks.labs.find(
        (l) => Number.isFinite(lat) && Number.isFinite(lng) && l.latitude === lat && l.longitude === lng
      );
      if (dekat) warnings.push(`Koordinat sama persis dengan ${dekat.nama}.`);
    }
    return { errors, warnings };
  }

  // Praktikan / asprak
  const nim = (v.nim ?? '').trim();
  if (nim && !/^[\w./-]{3,24}$/.test(nim)) errors.push('Format NIM tidak valid.');
  const kodeLab = normalkanKodeLab(v.laboratoriumkode ?? '');
  const lab = kodeLab ? konteks.labs.find((l) => normalkanKodeLab(l.kode) === kodeLab) : undefined;
  if (kodeLab && !lab) errors.push(`Laboratorium ${kodeLab} tidak ditemukan.`);

  const role: Role = jenis === 'asprak' ? 'asisten' : 'praktikan';
  if (nim) {
    const user = konteks.users.find((u) => u.nim.trim().toLowerCase() === nim.toLowerCase());
    if (!user) errors.push(`NIM ${nim} belum terdaftar di aplikasi. Minta yang bersangkutan mendaftar dulu.`);
    else {
      if (!user.roles.includes(role)) {
        errors.push(
          role === 'asisten'
            ? `Akun ${user.nama} belum terdaftar sebagai asisten.`
            : `Akun ${user.nama} tidak memiliki peran praktikan.`
        );
      }
      if (v.nama && user.nama.trim().toLowerCase() !== v.nama.trim().toLowerCase()) {
        warnings.push(`Nama di file berbeda dari akun (${user.nama}).`);
      }
      if (lab && konteks.anggota.some((a) => a.userId === user.uid && a.laboratoriumId === lab.id)) {
        errors.push('Sudah terdaftar di laboratorium ini.');
      }
    }
    if (kodeLab && sebelumnya.some((r) => (r.values.nim ?? '').trim().toLowerCase() === nim.toLowerCase() && normalkanKodeLab(r.values.laboratoriumkode ?? '') === kodeLab)) {
      errors.push('NIM ganda untuk laboratorium yang sama di dalam file.');
    }
  }
  if (jenis === 'asprak' && !v.kelas?.trim()) warnings.push('Kelas kosong; asprak tetap dapat dibuat tanpa kelas.');
  return { errors, warnings };
}

/** Validasi ulang seluruh baris. Baris yang ditolak dipertahankan statusnya. */
export function validasiSemua(rows: ImportRow[], jenis: JenisImpor, konteks: KonteksValidasi): ImportRow[] {
  return rows.map((r) => {
    const { errors, warnings } = validasiBaris(r, jenis, konteks, rows);
    // Baris yang sebelumnya diterima tetapi sekarang bermasalah kembali ke tinjauan.
    const status = r.status === 'accepted' && errors.length > 0 ? 'review' : r.status;
    return { ...r, errors, warnings, status };
  });
}

/* ------------------------------------------------------------------ */
/* DATA PEMBANDING                                                     */
/* ------------------------------------------------------------------ */

function ambilDb() {
  if (!db) throw new Error('Firebase belum dikonfigurasi. Periksa file .env.');
  return db;
}

export async function muatSemuaUser(): Promise<ProfilUser[]> {
  const snap = await getDocs(collection(ambilDb(), COLLECTIONS.USERS));
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      uid: d.id,
      nama: String(x.nama ?? ''),
      nim: String(x.nim ?? ''),
      email: String(x.email ?? ''),
      roles: bacaRoles(x),
    };
  });
}

export async function muatSemuaAnggota(): Promise<Anggota[]> {
  const snap = await getDocs(collection(ambilDb(), COLLECTIONS.ANGGOTA));
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      userId: String(x.userId ?? ''),
      laboratoriumId: String(x.laboratoriumId ?? ''),
      nim: String(x.nim ?? ''),
      nama: String(x.nama ?? ''),
      kelas: String(x.kelas ?? ''),
      role: x.role === 'asisten' ? 'asisten' : 'praktikan',
    } as Anggota;
  });
}

/* ------------------------------------------------------------------ */
/* PENULISAN                                                           */
/* ------------------------------------------------------------------ */

export const idAnggota = (laboratoriumId: string, userId: string) => `${laboratoriumId}_${userId}`;

/** Menjalankan penulisan dalam beberapa batch (batas Firestore 500 operasi). */
async function jalankanBatch(operasi: ((b: WriteBatch) => void)[]) {
  const firestore = ambilDb();
  for (let i = 0; i < operasi.length; i += 400) {
    const batch = writeBatch(firestore);
    operasi.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }
}

/** FR-03 (bulk): membuat laboratorium dari baris yang diterima, seluruhnya untuk satu mata kuliah. */
export async function buatLabBulk(rows: ImportRow[], mataKuliah: string): Promise<HasilBaris[]> {
  const firestore = ambilDb();
  if (!mataKuliah.trim()) throw new GalatImpor('Mata kuliah wajib diisi.');
  const diterima = rows.filter((r) => r.status === 'accepted' && r.errors.length === 0);
  if (diterima.length === 0) throw new GalatImpor('Tidak ada baris yang diterima.');

  const hasil: HasilBaris[] = [];
  const ops: ((b: WriteBatch) => void)[] = [];
  for (const r of diterima) {
    const v = r.values;
    const kode = normalkanKodeLab(v.kode);
    ops.push((b) =>
      b.set(doc(firestore, COLLECTIONS.LABORATORIUM, kode), {
        kode,
        nama: v.nama.trim(),
        gedung: v.gedung.trim(),
        lantai: v.lantai ? Number(v.lantai) : 1,
        latitude: angka(v.latitude),
        longitude: angka(v.longitude),
        radius: angka(v.radius),
        gracePeriodMinutes: v.graceperiodminutes ? Number(v.graceperiodminutes) : 15,
        deskripsi: v.deskripsi?.trim() ?? '',
        mataKuliah: mataKuliah.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    hasil.push({ rowId: r.id, ok: true, message: `Laboratorium ${kode} dibuat.` });
  }
  try {
    await jalankanBatch(ops);
  } catch (e) {
    return diterima.map((r) => ({ rowId: r.id, ok: false, message: pesanGalat(e) }));
  }
  return hasil;
}

export interface MasukanAnggota {
  user: ProfilUser;
  lab: Laboratorium;
  role: Role;
  kelas: string;
}

function dokAnggota(firestore: ReturnType<typeof ambilDb>, m: MasukanAnggota) {
  return {
    ref: doc(firestore, COLLECTIONS.ANGGOTA, idAnggota(m.lab.id, m.user.uid)),
    data: {
      userId: m.user.uid,
      laboratoriumId: m.lab.id,
      nim: m.user.nim,
      nama: m.user.nama,
      role: m.role,
      kelas: m.kelas.trim().toUpperCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  };
}

/** FR-04 (single): memasukkan satu praktikan/asprak ke laboratorium. */
export async function tambahAnggota(m: MasukanAnggota, sudahAda: Anggota[]): Promise<void> {
  const firestore = ambilDb();
  if (!m.user.roles.includes(m.role)) {
    throw new GalatImpor(m.role === 'asisten' ? 'Akun ini belum terdaftar sebagai asisten.' : 'Akun ini tidak memiliki peran praktikan.');
  }
  if (m.role === 'praktikan' && !m.kelas.trim()) throw new GalatImpor('Kelas praktikan wajib diisi.');
  if (sudahAda.some((a) => a.userId === m.user.uid && a.laboratoriumId === m.lab.id)) {
    throw new GalatImpor('Sudah terdaftar di laboratorium ini. Gunakan fitur pindah untuk memindahkannya.');
  }
  const { ref, data } = dokAnggota(firestore, m);
  await jalankanBatch([(b) => b.set(ref, data)]);
}

/** FR-04 (bulk): memasukkan banyak anggota dari baris yang diterima. */
export async function tambahAnggotaBulk(
  rows: ImportRow[],
  jenis: Exclude<JenisImpor, 'laboratorium'>,
  konteks: KonteksValidasi
): Promise<HasilBaris[]> {
  const firestore = ambilDb();
  const role: Role = jenis === 'asprak' ? 'asisten' : 'praktikan';
  const diterima = rows.filter((r) => r.status === 'accepted' && r.errors.length === 0);
  if (diterima.length === 0) throw new GalatImpor('Tidak ada baris yang diterima.');

  const ops: ((b: WriteBatch) => void)[] = [];
  const hasil: HasilBaris[] = [];
  for (const r of diterima) {
    const user = konteks.users.find((u) => u.nim.trim().toLowerCase() === r.values.nim.trim().toLowerCase());
    const lab = konteks.labs.find((l) => normalkanKodeLab(l.kode) === normalkanKodeLab(r.values.laboratoriumkode));
    if (!user || !lab) {
      hasil.push({ rowId: r.id, ok: false, message: 'Data pengguna atau laboratorium tidak ditemukan.' });
      continue;
    }
    const { ref, data } = dokAnggota(firestore, { user, lab, role, kelas: r.values.kelas ?? '' });
    ops.push((b) => b.set(ref, data));
    hasil.push({ rowId: r.id, ok: true, message: `${user.nama} masuk ke ${lab.nama}.` });
  }
  try {
    await jalankanBatch(ops);
  } catch (e) {
    return hasil.map((h) => (h.ok ? { ...h, ok: false, message: pesanGalat(e) } : h));
  }
  return hasil;
}

/** FR-04: memindahkan anggota (praktikan atau asprak) ke laboratorium lain dalam satu batch. */
export async function pindahkanAnggota(
  anggota: Anggota,
  labTujuan: Laboratorium,
  kelasBaru: string | undefined,
  semuaAnggota: Anggota[]
): Promise<void> {
  const firestore = ambilDb();
  if (anggota.laboratoriumId === labTujuan.id) throw new GalatImpor('Laboratorium tujuan sama dengan laboratorium asal.');
  if (semuaAnggota.some((a) => a.userId === anggota.userId && a.laboratoriumId === labTujuan.id)) {
    throw new GalatImpor('Anggota ini sudah terdaftar di laboratorium tujuan.');
  }
  const kelas = (kelasBaru ?? anggota.kelas).trim().toUpperCase();
  if (anggota.role === 'praktikan' && !kelas) throw new GalatImpor('Kelas praktikan wajib diisi.');
  await jalankanBatch([
    (b) => b.delete(doc(firestore, COLLECTIONS.ANGGOTA, anggota.id)),
    (b) =>
      b.set(doc(firestore, COLLECTIONS.ANGGOTA, idAnggota(labTujuan.id, anggota.userId)), {
        userId: anggota.userId,
        laboratoriumId: labTujuan.id,
        nim: anggota.nim,
        nama: anggota.nama,
        role: anggota.role,
        kelas,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
  ]);
}

export async function keluarkanAnggota(anggota: Anggota): Promise<void> {
  await jalankanBatch([(b) => b.delete(doc(ambilDb(), COLLECTIONS.ANGGOTA, anggota.id))]);
}

export function pesanGalat(e: unknown): string {
  if (e instanceof Error && (e instanceof GalatImpor || !('code' in e))) return e.message;
  const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code.includes('permission-denied')) return 'Kamu tidak memiliki izin untuk aksi ini.';
  if (code.includes('unavailable') || code.includes('deadline')) return 'Koneksi bermasalah. Coba lagi.';
  return 'Terjadi gangguan saat menyimpan data. Coba lagi.';
}
