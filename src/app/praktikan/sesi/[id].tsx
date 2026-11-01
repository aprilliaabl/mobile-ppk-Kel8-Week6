import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSesi, userDummy } from '../../../constants/dummy';
import { StatusBadge } from '../../../components/StatusBadge';
import { InfoRow } from '../../../components/InfoRow';
import { Button } from '../../../components/Button';
import { BottomSheet } from '../../../components/BottomSheet';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { EmptyState } from '../../../components/EmptyState';
import { Ikon } from '../../../components/Ikon';
import { TopBar } from '../../../components/TopBar';
import { formatJamRentang, formatTanggalPanjang } from '../../../constants/format';
import { catatPresensi, cekSudahPresensi } from '../../../constants/presensiStore';
import { MAX_W, W } from '../../../constants/warna';

export default function DetailSesiPraktikan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const lebar = width >= 820;

  const sesi = useSesi(id);
  const praktikan = userDummy.find((u) => u.role === 'praktikan')!;

  // Cek apakah sudah pernah presensi di sesi ini (FR-07: tidak boleh dua kali)
  const existing = sesi ? cekSudahPresensi(sesi.id, praktikan.id) : undefined;
  const [waktuHadir, setWaktuHadir] = useState<string | null>(existing ? existing.waktuKehadiran : null);
  const hasAttended = !!waktuHadir;

  const [formOpen, setFormOpen] = useState(false);
  const [setuju, setSetuju] = useState(false); // pilihan di form konfirmasi
  const [showModal, setShowModal] = useState(false); // umpan balik berhasil (FR-08)

  if (!sesi) {
    return (
      <View style={styles.root}>
        <TopBar title="Detail Sesi" fallback="/praktikan/beranda" />
        <View style={styles.center}>
          <EmptyState ikon="kosong" judul="Sesi tidak ditemukan" deskripsi="Sesi yang kamu cari tidak ada dalam daftar." />
        </View>
      </View>
    );
  }

  const handlePresensi = () => {
    if (sesi.status !== 'dibuka' || hasAttended || !setuju) return;

    const now = new Date();
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tanggal = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    // Simpan ke in-memory store agar riwayat presensi langsung ter-update (FR-09)
    catatPresensi({
      sesiId: sesi.id,
      namaSesi: sesi.nama,
      kelas: sesi.kelas,
      praktikanId: praktikan.id,
      namaPraktikan: praktikan.nama,
      tanggal,
      waktuKehadiran: jam,
      status: 'HADIR',
    });

    setWaktuHadir(jam);
    setFormOpen(false);
    setSetuju(false);
    setShowModal(true);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Detail Sesi" fallback="/praktikan/beranda" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.inner, lebar && styles.innerLebar]}>
          <View style={[styles.card, lebar && { flex: 1 }]}>
            <View style={styles.top}>
              <Text style={styles.nama}>{sesi.nama}</Text>
              <StatusBadge status={sesi.status} />
            </View>
            <InfoRow ikon="grup" label="Kelas" value={sesi.kelas} />
            <InfoRow ikon="jadwal" label="Tanggal" value={formatTanggalPanjang(sesi.waktuMulai)} />
            <InfoRow ikon="jam" label="Waktu" value={formatJamRentang(sesi.waktuMulai, sesi.waktuSelesai)} />
            <InfoRow ikon="lokasi" label="Ruang" value={sesi.ruang} />
          </View>

          {/* Panel status presensi: berubah mengikuti status sesi dan catatan kehadiran */}
          {hasAttended ? (
            <View style={[styles.panel, lebar && { flex: 1 }, styles.panelOk]}>
              <Ikon nama="centang" size={34} color={W.green} />
              <Text style={[styles.panelTitle, { color: W.green }]}>Presensi sudah tercatat</Text>
              <Text style={styles.panelText}>Kamu hadir pukul {waktuHadir} WIB.</Text>
            </View>
          ) : sesi.status === 'belum_dibuka' ? (
            <View style={[styles.panel, lebar && { flex: 1 }]}>
              <Ikon nama="kunci" size={34} color={W.sub} />
              <Text style={styles.panelTitle}>Sesi belum dibuka</Text>
              <Text style={styles.panelText}>Tunggu asisten membuka sesi. Tombol presensi akan aktif setelahnya.</Text>
            </View>
          ) : sesi.status === 'ditutup' ? (
            <View style={[styles.panel, lebar && { flex: 1 }, styles.panelBad]}>
              <Ikon nama="kunci" size={34} color={W.red} />
              <Text style={[styles.panelTitle, { color: W.red }]}>Sesi telah ditutup</Text>
              <Text style={styles.panelText}>Presensi tidak dapat dilakukan karena sesi sudah ditutup dan kamu tidak tercatat hadir.</Text>
            </View>
          ) : (
            <View style={[styles.panel, lebar && { flex: 1 }, styles.panelOk]}>
              <Ikon nama="play" size={34} color={W.green} />
              <Text style={[styles.panelTitle, { color: W.green }]}>Sesi sedang dibuka</Text>
              <Text style={styles.panelText}>Kamu dapat melakukan presensi sekarang.</Text>
              {!!sesi.catatan && <Text style={styles.asistenNote}>Catatan asisten: {sesi.catatan}</Text>}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footInner}>
          {hasAttended ? (
            <>
              <Button label="Sudah Presensi" onPress={() => {}} disabled />
              <Button label="Lihat Bukti Kehadiran" variant="ghost" onPress={() => setShowModal(true)} />
            </>
          ) : (
            <Button
              label={sesi.status === 'dibuka' ? 'Presensi Sekarang' : sesi.status === 'ditutup' ? 'Sesi Ditutup' : 'Presensi Belum Tersedia'}
              variant="success"
              onPress={() => setFormOpen(true)}
              disabled={sesi.status !== 'dibuka'}
            />
          )}
        </View>
      </View>

      {/* Bottom sheet + form konfirmasi presensi */}
      <BottomSheet visible={formOpen} onClose={() => setFormOpen(false)} title="Konfirmasi presensi">
        <View style={styles.summary}>
          <Text style={styles.sumNama}>{praktikan.nama}</Text>
          <Text style={styles.sumSub}>{sesi.nama} • Kelas {sesi.kelas}</Text>
        </View>
        <Pressable onPress={() => setSetuju((v) => !v)} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: setuju }}>
          <View style={[styles.checkbox, setuju && styles.checkboxOn]}>
            {setuju && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkText}>Saya hadir dan mengikuti praktikum di {sesi.ruang}.</Text>
        </Pressable>
        <Button label="Kirim Presensi" variant="success" onPress={handlePresensi} disabled={!setuju} />
        <Button label="Batal" variant="ghost" onPress={() => setFormOpen(false)} />
      </BottomSheet>

      {/* Modal umpan balik berhasil (FR-08) */}
      <ConfirmModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        ikon="centang"
        tone="success"
        title="Presensi Berhasil"
        message="Data kehadiranmu telah tercatat."
        actions={
          <>
            <View style={styles.dRow}><Text style={styles.dLabel}>Waktu kehadiran</Text><Text style={[styles.dValue, { color: W.blue }]}>{waktuHadir} WIB</Text></View>
            <View style={styles.dRow}><Text style={styles.dLabel}>Praktikum</Text><Text style={styles.dValue}>{sesi.nama}</Text></View>
            <View style={styles.dRow}><Text style={styles.dLabel}>Kelas</Text><Text style={styles.dValue}>{sesi.kelas}</Text></View>
            <Button label="Tutup" variant="success" onPress={() => setShowModal(false)} />
            <Button label="Lihat riwayat" variant="ghost" onPress={() => { setShowModal(false); router.navigate('/praktikan/riwayat'); }} />
          </>
        }
      />
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
  panel: { backgroundColor: W.card, borderRadius: 20, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: W.line },
  panelOk: { backgroundColor: W.greenSoft, borderColor: W.green },
  panelBad: { backgroundColor: W.redSoft, borderColor: W.red },
  panelTitle: { fontSize: 16, fontWeight: '800', color: W.text },
  panelText: { fontSize: 13, color: W.sub, textAlign: 'center', lineHeight: 19 },
  asistenNote: { fontSize: 13, color: W.text, textAlign: 'center', marginTop: 4, fontWeight: '600' },
  footer: { backgroundColor: W.card, borderTopWidth: 1, borderTopColor: W.line, paddingHorizontal: 16, paddingTop: 12 },
  footInner: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 4 },
  summary: { backgroundColor: W.bg, borderRadius: 12, padding: 12 },
  sumNama: { fontSize: 16, fontWeight: '800', color: W.text },
  sumSub: { fontSize: 13, color: W.sub, marginTop: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: W.sub, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: W.green, borderColor: W.green },
  checkMark: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  checkText: { flex: 1, fontSize: 14, color: W.text, lineHeight: 20 },
  dRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  dLabel: { fontSize: 13, color: W.sub },
  dValue: { fontSize: 13, color: W.text, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
});
