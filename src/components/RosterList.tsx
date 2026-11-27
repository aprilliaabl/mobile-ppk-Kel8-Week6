import { StyleSheet, Text, View } from 'react-native';
import { inisial } from '../constants/format';
import { W, warnaAvatar } from '../constants/warna';

export type StatusRoster = 'TEPAT_WAKTU' | 'TERLAMBAT' | 'IZIN' | 'IZIN_PENDING' | 'BELUM';

export interface BarisRoster {
  id: string;
  nama: string;
  nim: string;
  status: StatusRoster;
  /** Jam presensi, hanya untuk yang sudah hadir. */
  waktu?: string;
}

const TAMPIL: Record<StatusRoster, { label: string; fg: string; bg: string }> = {
  TEPAT_WAKTU: { label: 'TEPAT WAKTU', fg: W.green, bg: W.greenSoft },
  TERLAMBAT: { label: 'TERLAMBAT', fg: W.amber, bg: 'rgba(245,158,11,0.15)' },
  IZIN: { label: 'IZIN', fg: W.blue, bg: W.blueSoft },
  IZIN_PENDING: { label: 'IZIN DIAJUKAN', fg: W.blue, bg: W.blueSoft },
  BELUM: { label: 'BELUM HADIR', fg: W.gray, bg: W.graySoft },
};

/** Daftar peserta beserta status kehadirannya. Tidak scroll sendiri, aman di dalam ScrollView. */
export function RosterList({ data }: { data: BarisRoster[] }) {
  return (
    <View>
      {data.map((p, i) => {
        const t = TAMPIL[p.status];
        return (
          <View key={p.id} style={[styles.row, i > 0 && styles.border]}>
            <View style={[styles.avatar, { backgroundColor: warnaAvatar(p.nama) }]}>
              <Text style={styles.avatarText}>{inisial(p.nama)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nama} numberOfLines={1}>{p.nama}</Text>
              <Text style={styles.nim}>{p.nim || '-'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              {!!p.waktu && <Text style={styles.waktu}>{p.waktu}</Text>}
              <View style={[styles.pill, { backgroundColor: t.bg }]}>
                <Text style={[styles.pillText, { color: t.fg }]}>{t.label}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  border: { borderTopWidth: 1, borderTopColor: W.line },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  nama: { fontSize: 15, fontWeight: '700', color: W.text },
  nim: { fontSize: 12, color: W.sub, marginTop: 1 },
  waktu: { fontSize: 14, fontWeight: '700', color: W.blue, fontVariant: ['tabular-nums'] },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
});
