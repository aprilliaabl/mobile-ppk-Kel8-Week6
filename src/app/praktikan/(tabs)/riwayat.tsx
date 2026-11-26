import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderCard, StatBox } from '../../../components/HeaderCard';
import { EmptyState } from '../../../components/EmptyState';
import { useCurrentUser } from '../../../constants/dummy';
import { useRiwayatPraktikan } from '../../../constants/presensiStore';
import { useRiwayatIzinPraktikan } from '../../../constants/izinStore';
import { useTagihanPraktikan } from '../../../constants/dendaStore';
import type { StatusIzin, StatusTagihanDenda } from '../../../constants/types';
import { MAX_W, W } from '../../../constants/warna';

function badgeIzin(status: StatusIzin) {
  if (status === 'disetujui') {
    return { bg: W.greenSoft, fg: W.green, label: '● DISETUJUI (BEBAS DENDA)' };
  }
  if (status === 'ditolak') {
    return { bg: W.redSoft, fg: W.red, label: '● DITOLAK' };
  }
  return { bg: 'rgba(245,158,11,0.16)', fg: W.amber, label: '● MENUNGGU' };
}

function badgeTagihan(status: StatusTagihanDenda) {
  if (status === 'LUNAS') {
    return { bg: W.greenSoft, fg: W.green, label: '● LUNAS' };
  }
  if (status === 'DIBEBASKAN') {
    return { bg: 'rgba(147, 51, 234, 0.16)', fg: '#9333EA', label: '● DIBEBASKAN (IZIN)' };
  }
  if (status === 'PENDING') {
    return { bg: 'rgba(245,158,11,0.16)', fg: W.amber, label: '● MEMPROSES PEMBAYARAN' };
  }
  return { bg: W.redSoft, fg: W.red, label: '● BELUM DIBAYAR' };
}

/** FR-09, FR-14, FR-15, FR-16: Catatan kehadiran, denda keterlambatan, dan pembebasan denda izin. */
export default function RiwayatPraktikan() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cols = width >= 1000 ? 3 : width >= 640 ? 2 : 1;

  const praktikan = useCurrentUser('praktikan');
  const riwayat = useRiwayatPraktikan(praktikan.id);
  const daftarIzin = useRiwayatIzinPraktikan(praktikan.id);
  const daftarTagihan = useTagihanPraktikan(praktikan.id);

  const totalDendaBelumDibayar = daftarTagihan
    .filter((t) => t.status === 'BELUM_DIBAYAR')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}
    >
      <View style={styles.inner}>
        <HeaderCard badge="PRAKTIKAN" title="Riwayat, Izin & Denda" subtitle={`${praktikan.nama} • pantau kehadiran, pengajuan izin, dan tagihan denda`}>
          <View style={styles.stats}>
            <StatBox label="Total hadir" value={riwayat.length} color={W.green} />
            <StatBox label="Izin diajukan" value={daftarIzin.length} color={W.amber} />
            <StatBox label="Denda tertunda" value={`Rp ${totalDendaBelumDibayar.toLocaleString('id-ID')}`} color={totalDendaBelumDibayar > 0 ? W.red : W.sub} />
          </View>
        </HeaderCard>

        {/* Bagian Tagihan Denda Keterlambatan (FR-15 & FR-16) */}
        <Text style={styles.sectionTitle}>Tagihan Denda Keterlambatan</Text>
        {daftarTagihan.length === 0 ? (
          <EmptyState
            ikon="kosong"
            judul="Tidak ada tagihan denda"
            deskripsi="Selamat! Kamu selalu presensi tepat waktu dan tidak memiliki tunggakan denda keterlambatan."
          />
        ) : (
          <View style={styles.grid}>
            {daftarTagihan.map((tagihan) => {
              const b = badgeTagihan(tagihan.status);
              return (
                <View key={tagihan.id} style={{ width: `${100 / cols}%`, padding: 6 }}>
                  <View style={[styles.card, tagihan.status === 'BELUM_DIBAYAR' && { borderColor: W.red }]}>
                    <View style={styles.top}>
                      <Text style={styles.nama}>{tagihan.namaSesi}</Text>
                      <View style={[styles.badge, { backgroundColor: b.bg }]}>
                        <Text style={[styles.badgeText, { color: b.fg }]}>{b.label}</Text>
                      </View>
                    </View>
                    <View style={styles.divider} />
                    <Row label="Nominal Denda" value={`Rp ${tagihan.nominal.toLocaleString('id-ID')}`} highlight />
                    <Row label="Keterlambatan" value={`${tagihan.menitKeterlambatan} menit`} />
                    <Row label="Tanggal Tagihan" value={tagihan.tanggalTagihan} />
                    <Row label="Keterangan" value={tagihan.alasan} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Bagian Status Pengajuan Izin Real-Time (FR-14) */}
        <Text style={styles.sectionTitle}>Status Pengajuan Izin</Text>
        {daftarIzin.length === 0 ? (
          <EmptyState
            ikon="kosong"
            judul="Belum ada pengajuan izin"
            deskripsi="Pengajuan izin ketidakhadiran yang kamu kirim akan terpantau statusnya secara real-time di sini."
          />
        ) : (
          <View style={styles.grid}>
            {daftarIzin.map((izin) => {
              const b = badgeIzin(izin.status);
              return (
                <View key={izin.id} style={{ width: `${100 / cols}%`, padding: 6 }}>
                  <View style={styles.card}>
                    <View style={styles.top}>
                      <Text style={styles.nama}>{izin.namaSesi}</Text>
                      <View style={[styles.badge, { backgroundColor: b.bg }]}>
                        <Text style={[styles.badgeText, { color: b.fg }]}>{b.label}</Text>
                      </View>
                    </View>
                    <View style={styles.divider} />
                    <Row label="Kelas" value={izin.kelas} />
                    <Row label="Diajukan" value={`${izin.tanggalPengajuan} • ${izin.waktuPengajuan} WIB`} />
                    <Row label="Alasan" value={izin.alasan} />
                    {!!izin.diprosesOleh && (
                      <Row label="Diproses oleh" value={izin.diprosesOleh} highlight />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Bagian Riwayat Kehadiran (FR-09) */}
        <Text style={styles.sectionTitle}>Riwayat Kehadiran</Text>
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
                  {item.statusKetepatan === 'TERLAMBAT' && !!item.menitKeterlambatan && (
                    <Row label="Keterlambatan" value={`${item.menitKeterlambatan} menit (denda dibuat)`} highlight />
                  )}
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
  sectionTitle: { fontSize: 18, fontWeight: '800', color: W.text, marginTop: 10, paddingHorizontal: 6 },
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
