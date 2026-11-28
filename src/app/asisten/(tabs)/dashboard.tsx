import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '../../../components/BottomSheet';
import { Button } from '../../../components/Button';
import { DaftarIzinAsisten } from '../../../components/DaftarIzinAsisten';
import { EmptyState } from '../../../components/EmptyState';
import { Ikon } from '../../../components/Ikon';
import { KontrolSesi } from '../../../components/KontrolSesi';
import { PintasanRow, RingkasStat, Sapaan } from '../../../components/Ringkas';
import { RosterList, type BarisRoster, type StatusRoster } from '../../../components/RosterList';
import { ErrorState, LoadingState } from '../../../components/StateView';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatJamRentang } from '../../../constants/format';
import { useDaftarIzinAsisten } from '../../../constants/izinStore';
import { useLaboratoriumList } from '../../../constants/laboratoriumStore';
import { muatUlangSesi, useRekapSesi, useSesiList, useSesiStatus } from '../../../constants/sesiStore';
import { MAX_W, W } from '../../../constants/warna';
import { useSemuaAnggota } from '../../../hooks/use-anggota';
import { useCurrentUser } from '../../../hooks/use-current-user';

type Filter = 'SEMUA' | 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'BELUM';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'SEMUA', label: 'Semua' },
  { key: 'HADIR', label: 'Hadir' },
  { key: 'TERLAMBAT', label: 'Terlambat' },
  { key: 'IZIN', label: 'Izin' },
  { key: 'BELUM', label: 'Belum' },
];

/**
 * Beranda asisten, dirancang agar muat satu layar: sapaan, ringkasan satu baris, pintasan, lalu satu kartu
 * sesi yang dipantau. Rekap peserta dan daftar izin dibuka di panel bawah hanya saat dibutuhkan.
 */
export default function BerandaAsistenDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const asisten = useCurrentUser('asisten');
  const sesiList = useSesiList();
  const statusSesi = useSesiStatus();
  const labs = useLaboratoriumList();
  const { anggota } = useSemuaAnggota();
  const izinSemua = useDaftarIzinAsisten(undefined, 'asisten');

  const urut = useMemo(() => [...sesiList].sort((a, b) => a.waktuMulai.localeCompare(b.waktuMulai)), [sesiList]);
  const [pilihId, setPilihId] = useState('');
  const [panel, setPanel] = useState<'rekap' | 'izin' | null>(null);
  const [cari, setCari] = useState('');
  const [filter, setFilter] = useState<Filter>('SEMUA');

  const sesi =
    urut.find((s) => s.id === pilihId) ??
    urut.find((s) => s.status === 'dibuka') ??
    urut.find((s) => s.status === 'belum_dibuka') ??
    urut[urut.length - 1];
  const rekap = useRekapSesi(sesi?.id, 'asisten');
  const izinSesi = useDaftarIzinAsisten(sesi?.id, 'asisten');

  const awal = new Date().setHours(0, 0, 0, 0);
  const sesiHariIni = sesiList.filter((s) => {
    const t = new Date(s.waktuMulai).getTime();
    return t >= awal && t < awal + 86400000;
  }).length;
  const sesiDibuka = sesiList.filter((s) => s.status === 'dibuka').length;
  const izinPending = izinSemua.filter((i) => i.status === 'pending');
  const izinPendingSesi = izinSesi.filter((i) => i.status === 'pending').length;

  // Peserta yang diharapkan: praktikan kelas sesi pada laboratorium sesi (bila ada).
  const roster: BarisRoster[] = useMemo(() => {
    if (!sesi) return [];
    const kelas = sesi.kelas.trim().toUpperCase();
    const diharapkan = anggota.filter(
      (a) =>
        a.role === 'praktikan' &&
        a.kelas.trim().toUpperCase() === kelas &&
        (!sesi.laboratoriumId || a.laboratoriumId === sesi.laboratoriumId)
    );
    const hadirMap = new Map(rekap.map((r) => [r.id.slice(sesi.id.length + 1), r]));
    const izinMap = new Map(izinSesi.map((i) => [i.praktikanId, i]));
    const baris: BarisRoster[] = diharapkan.map((a) => {
      const h = hadirMap.get(a.userId);
      const iz = izinMap.get(a.userId);
      let status: StatusRoster = 'BELUM';
      if (h) status = h.status;
      else if (iz?.status === 'disetujui') status = 'IZIN';
      else if (iz?.status === 'pending') status = 'IZIN_PENDING';
      return { id: a.userId, nama: a.nama, nim: a.nim, status, waktu: h?.waktu };
    });
    const dikenal = new Set(diharapkan.map((a) => a.userId));
    rekap.forEach((r) => {
      const uid = r.id.slice(sesi.id.length + 1);
      if (!dikenal.has(uid)) baris.push({ id: uid, nama: r.nama, nim: r.nim, status: r.status, waktu: r.waktu });
    });
    return baris.sort((a, b) => a.nama.localeCompare(b.nama));
  }, [sesi, anggota, rekap, izinSesi]);

  if (statusSesi.error) return <ErrorState pesan={statusSesi.error} onCoba={muatUlangSesi} />;
  if (statusSesi.loading && sesiList.length === 0) return <LoadingState teks="Memuat sesi praktikum..." />;

  const hadir = roster.filter((r) => r.status === 'TEPAT_WAKTU' || r.status === 'TERLAMBAT').length;
  const telat = roster.filter((r) => r.status === 'TERLAMBAT').length;
  const total = roster.length > 0 ? roster.length : sesi?.jumlahPeserta ?? 0;
  const persen = total > 0 ? Math.min(100, Math.round((hadir / total) * 100)) : 0;

  const q = cari.trim().toLowerCase();
  const tampil = roster.filter((r) => {
    const cocok =
      filter === 'SEMUA' ||
      (filter === 'HADIR' && (r.status === 'TEPAT_WAKTU' || r.status === 'TERLAMBAT')) ||
      (filter === 'TERLAMBAT' && r.status === 'TERLAMBAT') ||
      (filter === 'IZIN' && (r.status === 'IZIN' || r.status === 'IZIN_PENDING')) ||
      (filter === 'BELUM' && r.status === 'BELUM');
    return cocok && (!q || r.nama.toLowerCase().includes(q) || r.nim.toLowerCase().includes(q));
  });

  const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const pilihSesi = (id: string) => {
    setPilihId(id);
    setCari('');
    setFilter('SEMUA');
  };
  const bukaIzinPertama = () => {
    const pertama = izinPending[0];
    if (pertama) pilihSesi(pertama.sesiId);
    setPanel('izin');
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: W.bg }}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14, paddingBottom: 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <Sapaan judul={`Halo, ${asisten.nama.split(' ')[0] || asisten.nama}`} keterangan={tanggal} />

          <RingkasStat
            items={[
              { label: 'Hari ini', value: sesiHariIni },
              { label: 'Dibuka', value: sesiDibuka, color: sesiDibuka > 0 ? W.green : W.text },
              { label: 'Izin', value: izinPending.length, color: izinPending.length > 0 ? W.amber : W.text },
              { label: 'Lab', value: labs.length },
            ]}
          />

          <PintasanRow
            items={[
              { label: 'Peta', ikon: 'peta', onPress: () => router.push('/asisten/peta' as never) },
              { label: 'Riwayat', ikon: 'riwayat', onPress: () => router.push('/asisten/riwayat' as never) },
              { label: 'Lab', ikon: 'lab', onPress: () => router.push({ pathname: '/asisten/kelola', params: { seg: 'laboratorium' } } as never) },
              { label: 'Anggota', ikon: 'grup', onPress: () => router.push({ pathname: '/asisten/kelola', params: { seg: 'anggota' } } as never) },
            ]}
          />

          {izinPending.length > 0 && (
            <Pressable onPress={bukaIzinPertama} accessibilityRole="button" style={styles.perhatian}>
              <View style={styles.dotAmber} />
              <Text style={styles.perhatianText} numberOfLines={1}>
                {izinPending.length} pengajuan izin menunggu keputusan
              </Text>
              <Ikon nama="panah" size={14} color={W.amber} />
            </Pressable>
          )}

          {!sesi ? (
            <View style={styles.card}>
              <EmptyState ikon="kosong" judul="Belum ada sesi" deskripsi="Buat sesi di tab Jadwal. Kontrol dan rekapnya muncul di sini." />
            </View>
          ) : (
            <View style={styles.card}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {urut.map((s) => {
                  const aktif = s.id === sesi.id;
                  return (
                    <Pressable key={s.id} onPress={() => pilihSesi(s.id)} style={[styles.chip, aktif && styles.chipAktif]} accessibilityRole="button">
                      <Text style={[styles.chipText, aktif && { color: '#FFFFFF' }]} numberOfLines={1}>
                        {s.nama.replace('Praktikum ', '')} • {s.kelas}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.judul} numberOfLines={1}>{sesi.nama}</Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    Kelas {sesi.kelas} • {sesi.ruang} • {formatJamRentang(sesi.waktuMulai, sesi.waktuSelesai)}
                  </Text>
                </View>
                <StatusBadge status={sesi.status} />
              </View>

              <View style={{ gap: 6 }}>
                <View style={styles.progresRow}>
                  <Text style={styles.progresTeks}>{hadir}/{total} hadir</Text>
                  <Text style={styles.progresTeks}>{telat > 0 ? `${telat} terlambat • ` : ''}{persen}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${persen}%` }]} />
                </View>
              </View>

              <KontrolSesi sesi={{ ...sesi, jumlahPeserta: total }} mode="ganda" />

              <View style={styles.aksi}>
                <View style={{ flex: 1 }}><Button label="Rekap" variant="outline" onPress={() => setPanel('rekap')} /></View>
                <View style={{ flex: 1 }}><Button label={izinPendingSesi > 0 ? `Izin (${izinPendingSesi})` : 'Izin'} variant="outline" onPress={() => setPanel('izin')} /></View>
                <View style={{ flex: 1 }}><Button label="Detail" variant="outline" onPress={() => router.push(`/asisten/sesi/${sesi.id}` as never)} /></View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomSheet visible={panel === 'rekap'} onClose={() => setPanel(null)} title={sesi ? `Rekap • ${sesi.nama}` : 'Rekap'}>
        <View style={{ gap: 10 }}>
          {roster.length === 0 ? (
            <EmptyState
              ikon="kosong"
              judul="Belum ada peserta"
              deskripsi={
                sesi?.status === 'belum_dibuka'
                  ? 'Sesi belum dibuka. Buka sesi agar praktikan dapat presensi.'
                  : 'Belum ada yang presensi, dan belum ada praktikan kelas ini yang dimasukkan ke laboratorium (tab Kelola → Anggota).'
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
                      <Text style={[styles.chipText, aktif && { color: '#FFFFFF' }]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <ScrollView style={{ maxHeight: height * 0.5 }} nestedScrollEnabled>
                {tampil.length === 0 ? (
                  <EmptyState ikon="cari" judul="Tidak ditemukan" deskripsi="Tidak ada peserta yang cocok dengan pencarian atau filter." />
                ) : (
                  <RosterList data={tampil} />
                )}
              </ScrollView>
              <Text style={styles.catatan}>Terlambat dihitung dari grace period laboratorium sesi.</Text>
            </>
          )}
        </View>
      </BottomSheet>

      <BottomSheet visible={panel === 'izin'} onClose={() => setPanel(null)} title={sesi ? `Izin • ${sesi.nama}` : 'Izin'}>
        <ScrollView style={{ maxHeight: height * 0.6 }} nestedScrollEnabled>
          <DaftarIzinAsisten data={izinSesi} />
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, flexGrow: 1 },
  inner: { width: '100%', maxWidth: MAX_W, alignSelf: 'center', gap: 12 },
  perhatian: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 14, borderWidth: 1, borderColor: W.amber, paddingHorizontal: 14, minHeight: 48 },
  dotAmber: { width: 8, height: 8, borderRadius: 4, backgroundColor: W.amber },
  perhatianText: { flex: 1, fontSize: 13, fontWeight: '700', color: W.amber },
  card: { backgroundColor: W.card, borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: W.line },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 12, minHeight: 36, justifyContent: 'center', borderRadius: 999, backgroundColor: W.cardAlt, borderWidth: 1, borderColor: W.line },
  chipAktif: { backgroundColor: W.blue, borderColor: W.blue },
  chipText: { fontSize: 12, fontWeight: '600', color: W.sub, maxWidth: 180 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  judul: { fontSize: 16, fontWeight: '800', color: W.text },
  sub: { fontSize: 12, color: W.sub, marginTop: 2 },
  progresRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progresTeks: { fontSize: 12, fontWeight: '600', color: W.sub },
  track: { height: 6, borderRadius: 3, backgroundColor: W.cardAlt, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: W.green },
  aksi: { flexDirection: 'row', gap: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: W.bg, borderRadius: 12, borderWidth: 1, borderColor: W.cardAlt, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 11, fontSize: 14, color: W.text },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catatan: { fontSize: 11, color: W.sub },
});
