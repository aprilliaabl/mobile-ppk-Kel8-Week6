import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DaftarIzinAsisten } from '../../../components/DaftarIzinAsisten';
import { EmptyState } from '../../../components/EmptyState';
import { HeaderCard, StatBox } from '../../../components/HeaderCard';
import { Ikon } from '../../../components/Ikon';
import { KontrolSesi } from '../../../components/KontrolSesi';
import { RosterList, type BarisRoster, type StatusRoster } from '../../../components/RosterList';
import { ErrorState, LoadingState } from '../../../components/StateView';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatJamRentang, formatTanggal, formatWaktu } from '../../../constants/format';
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
  { key: 'BELUM', label: 'Belum hadir' },
];

const mulaiHariIni = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Beranda asisten: ringkasan, hal yang perlu perhatian, lalu pemantauan satu sesi (kontrol, rekap, izin). */
export default function BerandaAsistenDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const lebar = width >= 820;
  const asisten = useCurrentUser('asisten');
  const sesiList = useSesiList();
  const statusSesi = useSesiStatus();
  const labs = useLaboratoriumList();
  const { anggota } = useSemuaAnggota();
  const izinSemua = useDaftarIzinAsisten(undefined, 'asisten');

  const urut = useMemo(() => [...sesiList].sort((a, b) => a.waktuMulai.localeCompare(b.waktuMulai)), [sesiList]);
  const [pilihId, setPilihId] = useState('');
  const [cari, setCari] = useState('');
  const [filter, setFilter] = useState<Filter>('SEMUA');

  const sesi = urut.find((s) => s.id === pilihId) ?? urut.find((s) => s.status === 'dibuka') ?? urut.find((s) => s.status === 'belum_dibuka') ?? urut[urut.length - 1];
  const rekap = useRekapSesi(sesi?.id, 'asisten');
  const izinSesi = useDaftarIzinAsisten(sesi?.id, 'asisten');

  const awal = mulaiHariIni();
  const akhir = awal + 86400000;
  const sesiHariIni = sesiList.filter((s) => {
    const t = new Date(s.waktuMulai).getTime();
    return t >= awal && t < akhir;
  });
  const sesiDibuka = sesiList.filter((s) => s.status === 'dibuka');
  const izinPending = izinSemua.filter((i) => i.status === 'pending');

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
    // Yang presensi tetapi tidak ada di daftar anggota tetap ditampilkan.
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
  const tepat = roster.filter((r) => r.status === 'TEPAT_WAKTU').length;
  const telat = roster.filter((r) => r.status === 'TERLAMBAT').length;
  const total = roster.length > 0 ? roster.length : sesi?.jumlahPeserta ?? 0;
  const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;

  const q = cari.trim().toLowerCase();
  const tampil = roster.filter((r) => {
    const cocokFilter =
      filter === 'SEMUA' ||
      (filter === 'HADIR' && (r.status === 'TEPAT_WAKTU' || r.status === 'TERLAMBAT')) ||
      (filter === 'TERLAMBAT' && r.status === 'TERLAMBAT') ||
      (filter === 'IZIN' && (r.status === 'IZIN' || r.status === 'IZIN_PENDING')) ||
      (filter === 'BELUM' && r.status === 'BELUM');
    return cocokFilter && (!q || r.nama.toLowerCase().includes(q) || r.nim.toLowerCase().includes(q));
  });

  const pilihSesi = (id: string) => {
    setPilihId(id);
    setCari('');
    setFilter('SEMUA');
  };

  const tanggalHariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>
        <HeaderCard badge="ASISTEN" title={`Halo, ${asisten.nama}`} subtitle={tanggalHariIni}>
          <View style={styles.stats}>
            <StatBox label="Sesi hari ini" value={sesiHariIni.length} />
            <StatBox label="Sedang dibuka" value={sesiDibuka.length} color={W.green} />
            <StatBox label="Izin menunggu" value={izinPending.length} color={izinPending.length > 0 ? W.amber : W.text} />
          </View>
          <View style={styles.stats}>
            <StatBox label="Laboratorium" value={labs.length} />
            <StatBox label="Praktikan" value={anggota.filter((a) => a.role === 'praktikan').length} />
            <StatBox label="Asprak" value={anggota.filter((a) => a.role === 'asisten').length} />
          </View>
        </HeaderCard>

        {(sesiDibuka.length > 0 || izinPending.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.judul}>Perlu perhatian</Text>
            {sesiDibuka.map((s) => (
              <Pressable key={s.id} onPress={() => pilihSesi(s.id)} style={styles.perhatian} accessibilityRole="button">
                <View style={[styles.dot, { backgroundColor: W.green }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nama}>{s.nama} sedang dibuka</Text>
                  <Text style={styles.sub}>Kelas {s.kelas} • {s.ruang} • ketuk untuk memantau</Text>
                </View>
              </Pressable>
            ))}
            {izinPending.slice(0, 3).map((i) => (
              <Pressable key={i.id} onPress={() => pilihSesi(i.sesiId)} style={styles.perhatian} accessibilityRole="button">
                <View style={[styles.dot, { backgroundColor: W.amber }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nama}>{i.namaPraktikan} mengajukan izin</Text>
                  <Text style={styles.sub} numberOfLines={1}>{i.namaSesi} • {i.klasifikasiAI?.rekomendasi ?? 'Perlu tinjauan'}</Text>
                </View>
              </Pressable>
            ))}
            {izinPending.length > 3 && <Text style={styles.sub}>+{izinPending.length - 3} pengajuan izin lainnya</Text>}
          </View>
        )}

        {!sesi ? (
          <View style={styles.card}>
            <EmptyState ikon="kosong" judul="Belum ada sesi praktikum" deskripsi="Buat sesi di tab Jadwal. Setelah ada sesi, kontrol dan rekap kehadirannya muncul di sini." />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>PANTAU SESI</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {urut.map((s) => {
                  const aktif = s.id === sesi.id;
                  return (
                    <Pressable key={s.id} onPress={() => pilihSesi(s.id)} style={[styles.chip, aktif && styles.chipAktif]} accessibilityRole="button">
                      <Text style={[styles.chipText, aktif && styles.chipTextAktif]}>{s.nama.replace('Praktikum ', '')} • {s.kelas}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={[styles.kolom, lebar && styles.kolomLebar]}>
              <View style={[styles.card, lebar && { flex: 1 }]}>
                <View style={styles.rowTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.judul}>Kontrol Sesi</Text>
                    <Text style={styles.sub}>{sesi.nama} • Kelas {sesi.kelas}</Text>
                  </View>
                  <StatusBadge status={sesi.status} />
                </View>
                <View style={styles.meta}>
                  <Meta label="Jadwal" value={formatTanggal(sesi.waktuMulai)} />
                  <Meta label="Waktu" value={formatJamRentang(sesi.waktuMulai, sesi.waktuSelesai)} />
                  <Meta label="Ruang" value={sesi.ruang} />
                  <Meta label="Dibuka" value={sesi.dibukaPada ? `${formatWaktu(sesi.dibukaPada)} WIB` : '—'} />
                  <Meta label="Ditutup" value={sesi.ditutupPada ? `${formatWaktu(sesi.ditutupPada)} WIB` : '—'} />
                </View>
                <KontrolSesi sesi={{ ...sesi, jumlahPeserta: total }} mode="ganda" />
                <Pressable onPress={() => router.push(`/asisten/sesi/${sesi.id}` as never)} accessibilityRole="button" style={styles.tautan}>
                  <Text style={styles.tautanText}>Detail, ubah, atau hapus sesi</Text>
                  <Ikon nama="panah" size={14} color={W.blue} />
                </Pressable>
              </View>

              <View style={[styles.card, lebar && { flex: 1 }]}>
                <View style={styles.rowTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.judul}>Rekap Kehadiran</Text>
                    <Text style={styles.sub}>Diperbarui real-time</Text>
                  </View>
                  <View style={styles.total}><Text style={styles.totalText}>{hadir}/{total}</Text></View>
                </View>
                <View style={styles.stats}>
                  <StatBox label="Hadir" value={`${persen}%`} />
                  <StatBox label="Tepat waktu" value={tepat} color={W.green} />
                  <StatBox label="Terlambat" value={telat} color={W.amber} />
                </View>
                <Text style={styles.catatan}>Terlambat dihitung dari batas toleransi (grace period) laboratorium sesi.</Text>

                {roster.length === 0 ? (
                  <EmptyState
                    ikon={sesi.status === 'belum_dibuka' ? 'kunci' : 'kosong'}
                    judul={sesi.status === 'belum_dibuka' ? 'Rekap masih kosong' : 'Belum ada peserta'}
                    deskripsi={
                      sesi.status === 'belum_dibuka'
                        ? 'Sesi belum dibuka. Buka sesi agar praktikan dapat presensi.'
                        : 'Belum ada yang presensi, dan belum ada praktikan kelas ini yang dimasukkan ke laboratorium (tab Anggota).'
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
                      <EmptyState ikon="cari" judul="Tidak ditemukan" deskripsi="Tidak ada peserta yang cocok dengan pencarian atau filter." />
                    ) : (
                      <RosterList data={tampil} />
                    )}
                  </>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.judul}>Pengajuan Izin</Text>
                  <Text style={styles.sub}>Alasan praktikan beserta referensi klasifikasi AI untuk sesi ini</Text>
                </View>
                <View style={styles.total}>
                  <Text style={styles.totalText}>{izinSesi.filter((i) => i.status === 'pending').length > 0 ? `${izinSesi.filter((i) => i.status === 'pending').length} menunggu` : `${izinSesi.length} total`}</Text>
                </View>
              </View>
              <DaftarIzinAsisten data={izinSesi} />
            </View>
          </>
        )}

        <Pressable onPress={() => router.push('/asisten/riwayat' as never)} accessibilityRole="button" style={styles.tautanKartu}>
          <Ikon nama="riwayat" size={18} color={W.blue} />
          <Text style={styles.tautanText}>Lihat riwayat sesi yang sudah selesai</Text>
          <Ikon nama="panah" size={14} color={W.blue} />
        </Pressable>
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
  stats: { flexDirection: 'row', gap: 10, marginTop: 10 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: W.sub },
  kolom: { gap: 14 },
  kolomLebar: { flexDirection: 'row', alignItems: 'flex-start' },
  card: { backgroundColor: W.card, borderRadius: 20, padding: 18, gap: 12, borderWidth: 1, borderColor: W.line },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  judul: { fontSize: 17, fontWeight: '800', color: W.text },
  sub: { fontSize: 13, color: W.sub, marginTop: 2 },
  nama: { fontSize: 14, fontWeight: '700', color: W.text },
  perhatian: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: W.cardAlt, borderRadius: 14, padding: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  meta: { backgroundColor: W.cardAlt, borderRadius: 14, padding: 12, gap: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metaLabel: { fontSize: 13, color: W.sub },
  metaValue: { fontSize: 13, fontWeight: '700', color: W.text, flexShrink: 1, textAlign: 'right' },
  total: { backgroundColor: W.cardAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  totalText: { fontSize: 14, fontWeight: '800', color: W.text },
  catatan: { fontSize: 11, color: W.sub, marginTop: -6 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: W.bg, borderRadius: 12, borderWidth: 1, borderColor: W.cardAlt, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 11, fontSize: 14, color: W.text },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: W.cardAlt, borderWidth: 1, borderColor: W.line },
  chipAktif: { backgroundColor: W.blue, borderColor: W.blue },
  chipText: { fontSize: 13, fontWeight: '600', color: W.sub },
  chipTextAktif: { color: '#FFFFFF' },
  tautan: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  tautanText: { fontSize: 13, fontWeight: '700', color: W.blue },
  tautanKartu: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: W.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: W.line },
});
