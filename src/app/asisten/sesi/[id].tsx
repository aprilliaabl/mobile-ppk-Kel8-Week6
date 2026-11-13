import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBadge } from '../../../components/StatusBadge';
import { InfoRow } from '../../../components/InfoRow';
import { TopBar } from '../../../components/TopBar';
import { KontrolSesi } from '../../../components/KontrolSesi';
import { AksiSesi } from '../../../components/AksiSesi';
import { RekapList } from '../../../components/RekapList';
import { EmptyState } from '../../../components/EmptyState';
import { useRekapSesi, useSesi } from '../../../constants/dummy';
import { formatJamRentang, formatTanggalPanjang } from '../../../constants/format';
import { MAX_W, W } from '../../../constants/warna';

export default function DetailSesiAsisten() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const lebar = width >= 820;
  const sesi = useSesi(id);
  const rekap = useRekapSesi(sesi?.id, 'asisten');

  if (!sesi) {
    return (
      <View style={styles.root}>
        <TopBar title="Detail Sesi" fallback="/asisten/beranda" />
        <View style={styles.center}>
          <EmptyState ikon="kosong" judul="Sesi tidak ditemukan" deskripsi="Sesi yang kamu cari tidak ada dalam daftar." />
        </View>
      </View>
    );
  }
  const persen = Math.min(100, (rekap.length / sesi.jumlahPeserta) * 100);

  const statusInfo =
    sesi.status === 'belum_dibuka'
      ? { teks: 'Sesi belum dibuka. Buka sesi agar praktikan dapat melakukan presensi.', bg: W.graySoft }
      : sesi.status === 'dibuka'
      ? { teks: 'Sesi sedang berlangsung. Praktikan dapat melakukan presensi.', bg: W.greenSoft }
      : { teks: 'Sesi telah ditutup. Presensi tidak dapat dilakukan lagi.', bg: W.redSoft };

  return (
    <View style={styles.root}>
      <TopBar title="Detail Sesi" fallback="/asisten/beranda" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.inner, lebar && styles.innerLebar]}>
          {/* Info sesi */}
          <View style={[styles.card, lebar && { flex: 1 }]}>
            <View style={styles.top}>
              <Text style={styles.nama}>{sesi.nama}</Text>
              <StatusBadge status={sesi.status} />
            </View>
            <InfoRow ikon="grup" label="Kelas" value={`${sesi.kelas} • ${sesi.jumlahPeserta} praktikan`} />
            <InfoRow ikon="jadwal" label="Tanggal" value={formatTanggalPanjang(sesi.waktuMulai)} />
            <InfoRow ikon="jam" label="Waktu" value={formatJamRentang(sesi.waktuMulai, sesi.waktuSelesai)} />
            <InfoRow ikon="lokasi" label="Ruang" value={sesi.ruang} />
            <View style={[styles.note, { backgroundColor: statusInfo.bg }]}>
              <Text style={styles.noteText}>{statusInfo.teks}</Text>
            </View>
            {!!sesi.catatan && (
              <Text style={styles.catatan}>Catatan untuk praktikan: <Text style={{ color: W.text }}>{sesi.catatan}</Text></Text>
            )}
            <AksiSesi sesi={sesi} />
          </View>

          {/* Rekap kehadiran */}
          <View style={[styles.card, lebar && { flex: 1 }]}>
            <View style={styles.top}>
              <Text style={styles.sectionTitle}>Rekap Kehadiran</Text>
              <Text style={styles.count}>{rekap.length}/{sesi.jumlahPeserta}</Text>
            </View>
            <View style={styles.bar}><View style={[styles.barFill, { width: `${persen}%` }]} /></View>

            {rekap.length === 0 ? (
              <EmptyState
                ikon={sesi.status === 'belum_dibuka' ? 'kunci' : 'kosong'}
                judul={sesi.status === 'belum_dibuka' ? 'Sesi belum dibuka' : 'Belum ada yang presensi'}
                deskripsi={
                  sesi.status === 'belum_dibuka'
                    ? 'Rekap akan muncul setelah sesi dibuka dan praktikan melakukan presensi.'
                    : 'Daftar kehadiran akan muncul saat praktikan melakukan presensi.'
                }
              />
            ) : (
              <RekapList data={rekap} />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Aksi utama menempel di bawah layar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footInner}>
          {sesi.status === 'ditutup' ? (
            <View style={styles.selesai}><Text style={styles.selesaiText}>Sesi telah ditutup</Text></View>
          ) : (
            <KontrolSesi sesi={sesi} mode="tunggal" />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: W.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: W.bg },
  scroll: { padding: 16, paddingBottom: 24 },
  inner: { width: '100%', maxWidth: MAX_W, alignSelf: 'center', gap: 14 },
  innerLebar: { flexDirection: 'row', alignItems: 'flex-start' },
  card: { backgroundColor: W.card, borderRadius: 20, padding: 18, gap: 14, borderWidth: 1, borderColor: W.line },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  nama: { flex: 1, fontSize: 20, fontWeight: '800', color: W.text },
  note: { borderRadius: 12, padding: 12 },
  noteText: { fontSize: 13, color: W.text, lineHeight: 19 },
  catatan: { fontSize: 13, color: W.sub, lineHeight: 19 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: W.text },
  count: { fontSize: 15, fontWeight: '800', color: W.blue },
  bar: { height: 8, borderRadius: 4, backgroundColor: W.cardAlt, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: W.green, borderRadius: 4 },
  footer: { backgroundColor: W.card, borderTopWidth: 1, borderTopColor: W.line, paddingHorizontal: 16, paddingTop: 12 },
  selesai: { minHeight: 50, borderRadius: 14, backgroundColor: W.cardAlt, alignItems: 'center', justifyContent: 'center' },
  selesaiText: { color: W.sub, fontWeight: '700', fontSize: 15 },
  footInner: { width: '100%', maxWidth: 520, alignSelf: 'center' },
});