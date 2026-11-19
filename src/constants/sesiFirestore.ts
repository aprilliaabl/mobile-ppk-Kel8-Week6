import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { COLLECTIONS, db, isFirebaseConfigured } from '../config/firebase';
import type { DataSesi, Sesi, StatusSesi } from './types';

/** true jika .env Firebase sudah terisi dan Firestore siap dipakai. Jika false, aplikasi memakai data lokal. */
export const sesiAktif = (): boolean => isFirebaseConfigured && !!db;

/** Galat yang pesannya sudah siap ditampilkan ke pengguna. */
class GalatSesi extends Error {}

/** Mengubah galat Firestore menjadi pesan yang jelas untuk pengguna (FR-15). */
export function pesanFirestore(e: unknown): string {
  if (e instanceof GalatSesi) return e.message;
  const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code.includes('permission-denied')) return 'Kamu tidak memiliki izin untuk melakukan aksi ini.';
  if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.';
  }
  if (code.includes('not-found')) return 'Data sesi tidak ditemukan.';
  return 'Terjadi gangguan saat berkomunikasi dengan server. Silakan coba lagi.';
}

/**
 * Firestore menahan penulisan tanpa batas saat offline. Tanpa batas waktu, tombol "Menyimpan..."
 * akan menggantung selamanya, jadi proses dibatasi 10 detik.
 */
function denganBatasWaktu<T>(proses: Promise<T>, ms = 10000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new GalatSesi('Koneksi lambat atau terputus. Periksa internet lalu coba lagi.')),
      ms
    );
    proses.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

function ambilDb() {
  if (!db) throw new GalatSesi('Firebase belum dikonfigurasi.');
  return db;
}

async function jalankan<T>(proses: () => Promise<T>): Promise<T> {
  try {
    return await denganBatasWaktu(proses());
  } catch (e) {
    throw new GalatSesi(pesanFirestore(e));
  }
}

function dariDoc(d: QueryDocumentSnapshot<DocumentData>): Sesi {
  const x = d.data();
  return {
    id: d.id,
    nama: String(x.nama ?? ''),
    kelas: String(x.kelas ?? ''),
    ruang: String(x.ruang ?? ''),
    laboratoriumId: x.laboratoriumId ? String(x.laboratoriumId) : undefined,
    latitude: typeof x.latitude === 'number' ? x.latitude : undefined,
    longitude: typeof x.longitude === 'number' ? x.longitude : undefined,
    radius: typeof x.radius === 'number' ? x.radius : 25,
    waktuMulai: String(x.waktuMulai ?? ''),
    waktuSelesai: String(x.waktuSelesai ?? ''),
    status: (x.status as StatusSesi) ?? 'belum_dibuka',
    jumlahPeserta: Number(x.jumlahPeserta ?? 0),
    catatan: x.catatan ? String(x.catatan) : undefined,
    dibukaPada: x.dibukaPada ? String(x.dibukaPada) : undefined,
    ditutupPada: x.ditutupPada ? String(x.ditutupPada) : undefined,
  };
}

/** Keterangan tambahan dari setiap pembaruan data sesi. */
export interface InfoSnapshotSesi {
  /** true jika data berasal dari cache perangkat (mis. koneksi terputus), bukan dari server. */
  dariCache: boolean;
  /** ID sesi yang perubahannya berasal dari perangkat ini dan belum dikonfirmasi server. */
  tertunda: Set<string>;
}

/** FR-09: mendengarkan seluruh sesi secara real-time. Mengembalikan fungsi untuk berhenti mendengarkan. */
export function dengarSesi(
  onData: (daftar: Sesi[], info: InfoSnapshotSesi) => void,
  onError: (pesan: string) => void
): () => void {
  const q = query(collection(ambilDb(), COLLECTIONS.SESI), orderBy('waktuMulai'));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) =>
      onData(snap.docs.map(dariDoc), {
        dariCache: snap.metadata.fromCache,
        tertunda: new Set(snap.docs.filter((d) => d.metadata.hasPendingWrites).map((d) => d.id)),
      }),
    (err) => onError(pesanFirestore(err))
  );
}

/** FR-04: tambah sesi. */
export function tambahSesiFS(data: DataSesi): Promise<string> {
  return jalankan(async () => {
    const ref = await addDoc(collection(ambilDb(), COLLECTIONS.SESI), {
      ...data,
      status: 'belum_dibuka',
      createdAt: serverTimestamp(),
    });
    return ref.id;
  });
}

/** FR-04: ubah sesi. */
export function ubahSesiFS(id: string, data: Partial<DataSesi>): Promise<void> {
  return jalankan(() => updateDoc(doc(ambilDb(), COLLECTIONS.SESI, id), { ...data, updatedAt: serverTimestamp() }));
}

/** FR-04: hapus sesi. */
export function hapusSesiFS(id: string): Promise<void> {
  return jalankan(() => deleteDoc(doc(ambilDb(), COLLECTIONS.SESI, id)));
}

/** FR-05: buka sesi dengan transaksi, supaya dua asisten yang menekan bersamaan tidak membuka dua kali. */
export function bukaSesiFS(id: string, catatan?: string): Promise<void> {
  return jalankan(() => {
    const firestore = ambilDb();
    return runTransaction(firestore, async (tx) => {
      const ref = doc(firestore, COLLECTIONS.SESI, id);
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new GalatSesi('Sesi tidak ditemukan.');
      const status = snap.data().status as StatusSesi;
      if (status === 'dibuka') throw new GalatSesi('Sesi ini sudah dibuka.');
      if (status === 'ditutup') throw new GalatSesi('Sesi yang sudah ditutup tidak dapat dibuka kembali.');
      tx.update(ref, {
        status: 'dibuka',
        catatan: catatan?.trim() ?? '',
        dibukaPada: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    });
  });
}

/** FR-05: tutup sesi dengan transaksi. */
export function tutupSesiFS(id: string): Promise<void> {
  return jalankan(() => {
    const firestore = ambilDb();
    return runTransaction(firestore, async (tx) => {
      const ref = doc(firestore, COLLECTIONS.SESI, id);
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new GalatSesi('Sesi tidak ditemukan.');
      const status = snap.data().status as StatusSesi;
      if (status === 'belum_dibuka') throw new GalatSesi('Sesi belum dibuka, jadi belum dapat ditutup.');
      if (status === 'ditutup') throw new GalatSesi('Sesi ini sudah ditutup.');
      tx.update(ref, {
        status: 'ditutup',
        ditutupPada: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    });
  });
}
