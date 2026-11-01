import { ColorValue } from 'react-native';
import { SymbolView } from 'expo-symbols';

const MAP = {
  jadwal: { ios: 'calendar', android: 'calendar_month' },
  jam: { ios: 'clock', android: 'schedule' },
  lokasi: { ios: 'mappin.and.ellipse', android: 'location_on' },
  grup: { ios: 'person.2.fill', android: 'group' },
  centang: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  kosong: { ios: 'tray', android: 'inbox' },
  kunci: { ios: 'lock.fill', android: 'lock' },
  panah: { ios: 'chevron.right', android: 'chevron_right' },
  play: { ios: 'play.fill', android: 'play_arrow' },
  stop: { ios: 'stop.fill', android: 'stop' },
  catatan: { ios: 'note.text', android: 'sticky_note_2' },
  kembali: { ios: 'chevron.left', android: 'arrow_back' },
  dashboard: { ios: 'square.grid.2x2.fill', android: 'dashboard' },
  riwayat: { ios: 'clock.arrow.circlepath', android: 'history' },
  akun: { ios: 'person.crop.circle.fill', android: 'account_circle' },
  cari: { ios: 'magnifyingglass', android: 'search' },
  tambah: { ios: 'person.badge.plus', android: 'person_add' },
} as const;

export type NamaIkon = keyof typeof MAP;

export function Ikon({ nama, size = 18, color }: { nama: NamaIkon; size?: number; color: ColorValue }) {
  const m = MAP[nama];
  return <SymbolView name={{ ios: m.ios, android: m.android, web: m.android }} size={size} tintColor={color} />;
}
