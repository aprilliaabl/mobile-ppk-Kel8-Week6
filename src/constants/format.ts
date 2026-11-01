const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatWaktu(iso: string): string {
  const d = new Date(iso);
  const jam = d.getHours().toString().padStart(2, '0');
  const menit = d.getMinutes().toString().padStart(2, '0');
  return `${jam}.${menit}`;
}

function selisihHari(iso: string): number {
  const a = new Date(iso);
  const b = new Date();
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  const dasar = `${d.getDate()} ${BULAN[d.getMonth()]}`;
  const sel = selisihHari(iso);
  if (sel === 0) return `Hari ini, ${dasar}`;
  if (sel === 1) return `Besok, ${dasar}`;
  if (sel === -1) return `Kemarin, ${dasar}`;
  return `${HARI[d.getDay()]}, ${dasar}`;
}

export function formatTanggalPanjang(iso: string): string {
  const d = new Date(iso);
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatJamRentang(mulai: string, selesai: string): string {
  return `${formatWaktu(mulai)} – ${formatWaktu(selesai)} WIB`;
}

export function formatRentangWaktu(mulai: string, selesai: string): string {
  return `${formatTanggal(mulai)} • ${formatWaktu(mulai)}–${formatWaktu(selesai)}`;
}

export function inisial(nama: string): string {
  return nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0].toUpperCase())
    .join('');
}
