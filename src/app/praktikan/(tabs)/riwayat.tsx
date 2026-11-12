import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderCard, StatBox } from '../../../components/HeaderCard';
import { EmptyState } from '../../../components/EmptyState';
import { userDummy } from '../../../constants/dummy';
import { useRiwayatPraktikan } from '../../../constants/presensiStore';
import { useRefreshOnFocus } from '../../../hooks/use-refresh-on-focus';
import { MAX_W, W } from '../../../constants/warna';

/** FR-09: catatan kehadiran milik praktikan yang sedang masuk. */
export default function RiwayatPraktikan() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cols = width >= 1000 ? 3 : width >= 640 ? 2 : 1;
  useRefreshOnFocus();

  const praktikan = userDummy.find((u) => u.role === 'praktikan')!;
  const riwayat = useRiwayatPraktikan(praktikan.id);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}
    >
      <View style={styles.inner}>
        <HeaderCard badge="PRAKTIKAN" title="Riwayat Presensi" subtitle={`${praktikan.nama} • catatan kehadiranmu`}>
          <View style={styles.stats}>
            <StatBox label="Total kehadiran" value={riwayat.length} color={W.green} />
          </View>
        </HeaderCard>

        {riwayat.length === 0 ? (
          <EmptyState ikon="kosong" judul="Belum ada riwayat presensi" deskripsi="Presensi yang kamu lakukan akan tercatat di sini." />
        ) : (
          <View style={styles.grid}>
            {riwayat.map((item, i) => (
              <View key={`${item.sesiId}-${i}`} style={{ width: `${100 / cols}%`, padding: 6 }}>
                <View style={styles.card}>
                  <View style={styles.top}>
                    <Text style={styles.nama}>{item.namaSesi}</Text>
                    <View style={styles.badge}><Text style={styles.badgeText}>● {item.status}</Text></View>
                  </View>
                  <View style={styles.divider} />
                  <Row label="Kelas" value={item.kelas} />
                  <Row label="Tanggal" value={item.tanggal} />
                  <Row label="Waktu hadir" value={`${item.waktuKehadiran} WIB`} highlight />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && { color: W.blue, fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 10, flexGrow: 1 },
  inner: { width: '100%', maxWidth: MAX_W, alignSelf: 'center', gap: 12 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { backgroundColor: W.card, borderRadius: 18, padding: 16, gap: 8, borderWidth: 1, borderColor: W.line },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nama: { flex: 1, fontSize: 16, fontWeight: '800', color: W.text },
  badge: { backgroundColor: W.greenSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: W.green, fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: W.line },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 13, color: W.sub },
  value: { fontSize: 13, color: W.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
