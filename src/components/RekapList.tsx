import { View, Text, StyleSheet } from 'react-native';
import { BarisRekap } from '../constants/types';
import { inisial } from '../constants/format';
import { W, warnaAvatar } from '../constants/warna';

/** Daftar praktikan yang sudah presensi + waktu hadir. Tidak scroll sendiri, aman di dalam ScrollView. */
export function RekapList({ data }: { data: BarisRekap[] }) {
  return (
    <View>
      {data.map((p, i) => {
        const telat = p.status === 'TERLAMBAT';
        return (
          <View key={p.id} style={[styles.row, i > 0 && styles.border]}>
            <View style={[styles.avatar, { backgroundColor: warnaAvatar(p.nama) }]}>
              <Text style={styles.avatarText}>{inisial(p.nama)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nama} numberOfLines={1}>{p.nama}</Text>
              <Text style={styles.nim}>{p.nim}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              <Text style={styles.waktu}>{p.waktu}</Text>
              <View style={[styles.pill, { backgroundColor: telat ? 'rgba(245,158,11,0.15)' : W.greenSoft }]}>
                <Text style={[styles.pillText, { color: telat ? W.amber : W.green }]}>{telat ? 'TERLAMBAT' : 'TEPAT WAKTU'}</Text>
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
