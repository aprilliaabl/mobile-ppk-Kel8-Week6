import React, { useCallback, useState } from 'react';
import { FlatList, View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sesi, StatusSesi } from '../../../constants/types';
import { StatusBadge, WARNA_STATUS } from '../../../components/StatusBadge';
import { EmptyState } from '../../../components/EmptyState';
import { Ikon } from '../../../components/Ikon';
import { formatJamRentang, formatTanggal } from '../../../constants/format';
import { getRekapSesi, useSesiList, userDummy } from '../../../constants/dummy';
import { cekSudahPresensi } from '../../../constants/presensiStore';
import { MAX_W, W } from '../../../constants/warna';

type Filter = 'semua' | StatusSesi;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'dibuka', label: 'Dibuka' },
  { key: 'belum_dibuka', label: 'Belum Dibuka' },
  { key: 'ditutup', label: 'Ditutup' },
];

interface Props {
  role: 'asisten' | 'praktikan';
  /** Ditampilkan di atas daftar dan ikut ter-scroll (mis. kartu sapaan). */
  header?: React.ReactNode;
  /** Jika diisi, daftar hanya menampilkan sesi berstatus ini dan filter disembunyikan (mis. tab Riwayat). */
  statusTetap?: StatusSesi;
  judul?: string;
  kosong?: { judul: string; deskripsi: string };
}

export function JadwalList({ role, header, statusTetap, judul = 'Jadwal Praktikum', kosong }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const sesiList = useSesiList();
  const [filter, setFilter] = useState<Filter>('semua');
  const [tick, setTick] = useState(0);

  // Segarkan daftar saat layar kembali difokuskan (mis. setelah presensi / rekap berubah).
  useFocusEffect(useCallback(() => setTick((t) => t + 1), []));

  // HP: 1 kolom, tablet: 2 kolom, laptop: 3 kolom
  const cols = width >= 1000 ? 3 : width >= 640 ? 2 : 1;
  const praktikan = userDummy.find((u) => u.role === 'praktikan')!;

  const data = sesiList
    .filter((s) => (statusTetap ? s.status === statusTetap : filter === 'semua' || s.status === filter))
    .sort((a, b) => a.waktuMulai.localeCompare(b.waktuMulai));

  const footerUntuk = (s: Sesi): { teks: string; warna: string } => {
    if (role === 'asisten') {
      return { teks: `${getRekapSesi(s.id).length}/${s.jumlahPeserta} praktikan hadir`, warna: s.status === 'dibuka' ? W.green : W.sub };
    }
    if (cekSudahPresensi(s.id, praktikan.id)) return { teks: 'Presensi sudah tercatat', warna: W.green };
    if (s.status === 'dibuka') return { teks: 'Ketuk untuk presensi', warna: W.blue };
    return { teks: 'Lihat detail sesi', warna: W.sub };
  };

  return (
    <FlatList
      key={cols}
      numColumns={cols}
      data={data}
      extraData={tick}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: W.bg }}
      contentContainerStyle={[
        styles.list,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 },
      ]}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          {header}
          <Text style={styles.section}>{judul}</Text>
          {!statusTetap && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {FILTERS.map((f) => {
              const aktif = f.key === filter;
              return (
                <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, aktif && styles.chipAktif]} accessibilityRole="button">
                  <Text style={[styles.chipText, aktif && styles.chipTextAktif]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          ikon="kosong"
          judul={kosong?.judul ?? (filter === 'semua' ? 'Belum ada jadwal praktikum' : 'Tidak ada sesi')}
          deskripsi={kosong?.deskripsi ?? (filter === 'semua' ? 'Jadwal akan muncul di sini setelah ditambahkan.' : 'Tidak ada sesi dengan status ini. Coba pilih filter lain.')}
        />
      }
      renderItem={({ item }) => {
        const f = footerUntuk(item);
        return (
          <View style={{ width: `${100 / cols}%`, padding: 6 }}>
            <Pressable
              onPress={() => router.push(`/${role}/sesi/${item.id}` as never)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
            >
              <View style={[styles.accent, { backgroundColor: WARNA_STATUS[item.status].fg }]} />
              <View style={styles.body}>
                <View style={styles.row}>
                  <View style={styles.left}>
                    <Text style={styles.nama}>{item.nama}</Text>
                    <Text style={styles.kelas}>Kelas {item.kelas} • {item.ruang}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>
                <View style={styles.meta}>
                  <Ikon nama="jam" size={14} color={W.sub} />
                  <Text style={styles.metaText}>{formatTanggal(item.waktuMulai)} • {formatJamRentang(item.waktuMulai, item.waktuSelesai)}</Text>
                </View>
                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: f.warna }]}>{f.teks}</Text>
                  <Ikon nama="panah" size={14} color={W.sub} />
                </View>
              </View>
            </Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 10, flexGrow: 1, width: '100%', maxWidth: MAX_W, alignSelf: 'center' },
  headerWrap: { paddingHorizontal: 6, marginBottom: 6 },
  section: { fontSize: 18, fontWeight: '800', color: W.text, marginTop: 22, marginBottom: 12 },
  chips: { gap: 8, paddingBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: W.card, borderWidth: 1, borderColor: W.line },
  chipAktif: { backgroundColor: W.blue, borderColor: W.blue },
  chipText: { fontSize: 13, fontWeight: '600', color: W.sub },
  chipTextAktif: { color: '#FFFFFF' },
  card: { flexDirection: 'row', backgroundColor: W.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: W.line },
  accent: { width: 5 },
  body: { flex: 1, padding: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  left: { flex: 1 },
  nama: { fontSize: 16, fontWeight: '800', color: W.text },
  kelas: { fontSize: 13, color: W.sub, marginTop: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: W.sub, flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: W.line, paddingTop: 12 },
  footerText: { fontSize: 13, fontWeight: '700' },
});
