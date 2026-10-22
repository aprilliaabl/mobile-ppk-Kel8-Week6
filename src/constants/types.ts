export type StatusSesi = 'belum_dibuka' | 'dibuka' | 'ditutup';

export interface Sesi {
  id: string;
  nama: string;
  kelas: string;
  waktuMulai: string;
  waktuSelesai: string;
  status: StatusSesi;
}

export type Role = 'asisten' | 'praktikan';

export interface UserDummy {
  id: string;
  nama: string;
  role: Role;
}