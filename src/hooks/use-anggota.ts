import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { COLLECTIONS, db } from '../config/firebase';
import type { Anggota } from '../constants/types';

/** Seluruh keanggotaan laboratorium (khusus asisten), diperbarui real-time. */
export function useSemuaAnggota(): { anggota: Anggota[]; loading: boolean; error: string | null } {
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      setError('Firebase belum dikonfigurasi.');
      return;
    }
    return onSnapshot(
      collection(db, COLLECTIONS.ANGGOTA),
      (snap) => {
        setAnggota(
          snap.docs.map((d) => {
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
          })
        );
        setLoading(false);
        setError(null);
      },
      (e) => {
        setLoading(false);
        setError(e.code === 'permission-denied' ? 'Kamu tidak memiliki izin melihat anggota.' : 'Gagal memuat anggota. Periksa koneksi.');
      }
    );
  }, []);

  return { anggota, loading, error };
}
