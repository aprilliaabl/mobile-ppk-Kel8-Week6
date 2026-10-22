import { Sesi, UserDummy } from './types';

export const userDummy: UserDummy[] = [
  { id: 'u-1', nama: 'Dada', role: 'asisten' },
  { id: 'u-2', nama: 'Didi', role: 'praktikan' },
];

export const sesiDummy: Sesi[] = [
  {
    id: 's-1',
    nama: 'Praktikum Struktur Data',
    kelas: 'IF-2A',
    waktuMulai: '2026-10-23T08:00:00.000Z',
    waktuSelesai: '2026-10-23T10:00:00.000Z',
    status: 'belum_dibuka',
  },
  {
    id: 's-2',
    nama: 'Praktikum Basis Data',
    kelas: 'IF-2B',
    waktuMulai: '2026-10-23T10:30:00.000Z',
    waktuSelesai: '2026-10-23T12:30:00.000Z',
    status: 'dibuka',
  },
  {
    id: 's-3',
    nama: 'Praktikum Pemrograman Web',
    kelas: 'IF-3A',
    waktuMulai: '2026-10-24T08:00:00.000Z',
    waktuSelesai: '2026-10-24T10:00:00.000Z',
    status: 'ditutup',
  },
  {
    id: 's-4',
    nama: 'Praktikum Jaringan Komputer',
    kelas: 'IF-3B',
    waktuMulai: '2026-10-24T13:00:00.000Z',
    waktuSelesai: '2026-10-24T15:00:00.000Z',
    status: 'belum_dibuka',
  },
];