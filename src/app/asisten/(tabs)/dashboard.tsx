import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderCard, StatBox } from '../../../components/HeaderCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { KontrolSesi } from '../../../components/KontrolSesi';
import { RekapList } from '../../../components/RekapList';
import { EmptyState } from '../../../components/EmptyState';
import { Button } from '../../../components/Button';
import { Ikon } from '../../../components/Ikon';
import { simulasiPresensi, sisaSimulasi, useRekapSesi, useSesiList } from '../../../constants/dummy';
import { formatJamRentang, formatTanggal, formatWaktu } from '../../../constants/format';
import { MAX_W, W } from '../../../constants/warna';

type FilterRekap = 'SEMUA' | 'TEPAT_WAKTU' | 'TERLAMBAT';
const FILTERS: { key: FilterRekap; label: string }[] = [
  { key: 'SEMUA', label: 'Semua' },
  { key: 'TEPAT_WAKTU', label: 'Tepat Waktu' },
  { key: 'TERLAMBAT', label: 'Terlambat' },
];

/** Dashboard Asisten: kontrol sesi (FR-04/05) dan rekap kehadiran real-time (FR-08) untuk satu sesi terpilih. */
export default function DashboardAsisten() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const lebar = width >= 820;
  const sesiList = useSesiList();

  const urut = useMemo(() => [...sesiList].sort((a, b) => a.waktuMulai.localeCompare(b.waktuMulai)), [sesiList]);
  const [pilihId, setPilihId] = useState<string>(() => (urut.find((s) => s.status === 'dibuka') ?? urut[0])?.id ?? '');
  const [cari, setCari] = useState('');
  const [filter, setFilter] = useState<FilterRekap>('SEMUA');

  const sesi = urut.find((s) => s.id === pilihId);
  const rekap = useRekapSesi(sesi?.id, 'asisten');

  if (!sesi) {
    return <EmptyState ikon="kosong" judul="Belum ada jadwal praktikum" deskripsi="Dashboard akan tersedia setelah ada sesi." />;
  }
  const tepat = rekap.filter((r) => r.status === 'TEPAT_WAKTU').length;
  const telat = rekap.filter((r) => r.status === 'TERLAMBAT').length;
  const persen = Math.round((rekap.length / sesi.jumlahPeserta) * 100);

  const q = cari.trim().toLowerCase();
  const tampil = rekap.filter(
    (r) => (filter === 'SEMUA' || r.status === filter) && (!q || r.nama.toLowerCase().includes(q) || r.nim.toLowerCase().includes(q))
  );

  const pilihSesi = (id: string) => {
    setPilihId(id);
    setCari('');
    setFilter('SEMUA');
  };
  const sisa = sisaSimulasi(sesi.id);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>
        <HeaderCard badge="DASHBOARD ASISTEN" title="Dashboard Asisten" subtitle="Pengelolaan sesi & rekap presensi praktikum">
          <Text style={styles.label}>PILIH SESI</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {urut.map((s) => {
              const aktif = s.id === pilihId;
              return (
                <Pressable key={s.id} onPress={() => pilihSesi(s.id)} style={[styles.chip, aktif && styles.chipAktif]} accessibilityRole="button">
                  <Text style={[styles.chipText, aktif && styles.chipTextAktif]}>{s.nama.replace('Praktikum ', '')} • {s.kelas}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </HeaderCard>

        <View style={[styles.kolom, lebar && styles.kolomLebar]}>
          {/* Kontrol sesi */}
          <View style={[styles.card, lebar && { flex: 1 }]}>
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.judul}>Kontrol Sesi Praktikum</Text>
                <Text style={styles.sub}>{sesi.nama} • Kelas {sesi.kelas}</Text>
              </View>
              <StatusBadge status={sesi.status} />
            </View>

            <View style={styles.meta}>
              <Meta label="Jadwal" value={`${formatTanggal(sesi.waktuMulai)}`} />
              <Meta label="Waktu" value={formatJamRentang(sesi.waktuMulai, sesi.waktuSelesai)} />
              <Meta label="Ruang" value={sesi.ruang} />
              <Meta label="Waktu dibuka" value={sesi.dibukaPada ? `${formatWaktu(sesi.dibukaPada)} WIB` : '—'} />
              <Meta label="Waktu ditutup" value={sesi.ditutupPada ? `${formatWaktu(sesi.ditutupPada)} WIB` : '—'} />
            </View>

            <KontrolSesi sesi={sesi} mode="ganda" />

            {sesi.status === 'dibuka' && (
              <View style={styles.sim}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.simJudul}>Uji coba presensi real-time</Text>
                  <Text style={styles.simSub}>Simulasikan praktikan dummy hadir ke rekap.</Text>
                </View>
                <Button label={sisa > 0 ? 'Simulasikan' : 'Semua hadir'} variant="primary" onPress={() => simulasiPresensi(sesi.id)} disabled={sisa <= 0} />
              </View>
            )}
          </View>

          {/* Rekap kehadiran */}
          <View style={[styles.card, lebar && { flex: 1 }]}>
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.judul}>Rekap Kehadiran</Text>
                <Text style={styles.sub}>Pemantauan log presensi sesi ini</Text>
              </View>
              <View style={styles.total}><Text style={styles.totalText}>{rekap.length}/{sesi.jumlahPeserta}</Text></View>
            </View>

            <View style={styles.stats}>
              <StatBox label="Total hadir" value={`${persen}%`} />
              <StatBox label="Tepat waktu" value={tepat} color={W.green} />
              <StatBox label="Terlambat" value={telat} color={W.amber} />
            </View>
            <Text style={styles.catatanTelat}>Terlambat = hadir lebih dari 15 menit setelah sesi dimulai.</Text>

            {rekap.length === 0 ? (
              <EmptyState
                ikon={sesi.status === 'belum_dibuka' ? 'kunci' : 'kosong'}
                judul={sesi.status === 'belum_dibuka' ? 'Rekap masih kosong' : 'Belum ada yang presensi'}
                deskripsi={
                  sesi.status === 'belum_dibuka'
                    ? 'Sesi belum dibuka. Tekan "Buka Sesi" agar praktikan dapat presensi dan data kehadiran muncul di sini.'
                    : 'Daftar kehadiran akan muncul saat praktikan melakukan presensi.'
                }
              />
            ) : (
              <>
                <View style={styles.search}>
                  <Ikon nama="cari" size={16} color={W.sub} />
                  <TextInput value={cari} onChangeText={setCari} placeholder="Cari nama atau NIM" placeholderTextColor={W.sub} style={styles.input} />
                </View>
                <View style={styles.filters}>
                  {FILTERS.map((f) => {
                    const aktif = f.key === filter;
                    return (
                      <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, aktif && styles.chipAktif]} accessibilityRole="button">
                        <Text style={[styles.chipText, aktif && styles.chipTextAktif]}>{f.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {tampil.length === 0 ? (
                  <EmptyState ikon="cari" judul="Tidak ditemukan" deskripsi="Tidak ada praktikan yang cocok dengan pencarian atau filter." />
                ) : (
                  <RekapList data={tampil} />
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, flexGrow: 1 },
  inner: { width: '100%', maxWidth: MAX_W, alignSelf: 'center', gap: 14 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: W.sub, marginTop: 12, marginBottom: 6 },
  kolom: { gap: 14 },
  kolomLebar: { flexDirection: 'row', alignItems: 'flex-start' },
  card: { backgroundColor: W.card, borderRadius: 20, padding: 18, gap: 14, borderWidth: 1, borderColor: W.line },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  judul: { fontSize: 17, fontWeight: '800', color: W.text },
  sub: { fontSize: 13, color: W.sub, marginTop: 2 },
  meta: { backgroundColor: W.cardAlt, borderRadius: 14, padding: 12, gap: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metaLabel: { fontSize: 13, color: W.sub },
  metaValue: { fontSize: 13, fontWeight: '700', color: W.text, flexShrink: 1, textAlign: 'right' },
  sim: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: W.blueSoft, borderRadius: 14, padding: 12 },
  simJudul: { fontSize: 13, fontWeight: '700', color: W.text },
  simSub: { fontSize: 12, color: W.sub, marginTop: 2 },
  total: { backgroundColor: W.cardAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  totalText: { fontSize: 14, fontWeight: '800', color: W.text },
  stats: { flexDirection: 'row', gap: 10 },
  catatanTelat: { fontSize: 11, color: W.sub, marginTop: -6 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: W.bg, borderRadius: 12, borderWidth: 1, borderColor: W.cardAlt, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 11, fontSize: 14, color: W.text, outlineStyle: 'none' } as never,
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: W.cardAlt, borderWidth: 1, borderColor: W.line },
  chipAktif: { backgroundColor: W.blue, borderColor: W.blue },
  chipText: { fontSize: 13, fontWeight: '600', color: W.sub },
  chipTextAktif: { color: '#FFFFFF' },
});
