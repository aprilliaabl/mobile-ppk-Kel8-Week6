export function formatWaktu(iso: string): string {
  const d = new Date(iso);
  const jam = d.getHours().toString().padStart(2, '0');
  const menit = d.getMinutes().toString().padStart(2, '0');
  return `${jam}.${menit}`;
}

export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()];
  const tanggal = d.getDate();
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ][d.getMonth()];
  return `${hari}, ${tanggal} ${bulan}`;
}

export function formatRentangWaktu(mulai: string, selesai: string): string {
  return `${formatTanggal(mulai)} • ${formatWaktu(mulai)}–${formatWaktu(selesai)}`;
}