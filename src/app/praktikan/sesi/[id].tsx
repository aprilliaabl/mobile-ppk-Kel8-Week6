import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native';
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
import { submitPresensi, usePresensiPraktikanSesi } from '../../../constants/presensiStore';
import { ajukanIzin, useIzinSesiPraktikan } from '../../../constants/izinStore';
import { MAX_W, W } from '../../../constants/warna';

export default function DetailSesiPraktikan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const lebar = width >= 820;

  const sesi = useSesi(id);
  const praktikan = userDummy.find((u) => u.role === 'praktikan')!;

  // Cek apakah sudah pernah presensi di sesi ini secara reaktif (FR-07: tidak boleh dua kali)
  const existing = usePresensiPraktikanSesi(sesi?.id, praktikan.id);
  const waktuHadir = existing?.waktuKehadiran ?? null;
  const hasAttended = !!existing;

  // Cek apakah sudah pernah mengajukan izin pada sesi ini (FR-11)
  const existingIzin = useIzinSesiPraktikan(sesi?.id, praktikan.id);
  const hasRequestedIzin = !!existingIzin;

  const [formOpen, setFormOpen] = useState(false);
  const [setuju, setSetuju] = useState(false); // pilihan di form konfirmasi
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false); // umpan balik berhasil (FR-08)

  // State form pengajuan izin (FR-11)
  const [izinOpen, setIzinOpen] = useState(false);
  const [alasanIzin, setAlasanIzin] = useState('');
  const [submittingIzin, setSubmittingIzin] = useState(false);
  const [errorIzin, setErrorIzin] = useState<string | null>(null);
  const [showIzinModal, setShowIzinModal] = useState(false);

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

  const handlePresensi = async () => {
    if (!setuju || submitting) return;
    setErrorMsg(null);
    setSubmitting(true);

    const hasil = await submitPresensi({ sesi, praktikan });
    setSubmitting(false);

    if (!hasil.ok) {
      setErrorMsg(hasil.error ?? 'Presensi tidak dapat diproses.');
      return;
    }

    setFormOpen(false);
    setSetuju(false);
    setShowModal(true);
  };

  const handleAjukanIzin = async () => {
    if (submittingIzin) return;
    setErrorIzin(null);
    setSubmittingIzin(true);

    const hasil = await ajukanIzin({ sesi, praktikan, alasan: alasanIzin });
    setSubmittingIzin(false);

    if (!hasil.ok) {
      setErrorIzin(hasil.error ?? 'Pengajuan izin tidak dapat diproses.');
      return;
    }

    setIzinOpen(false);
    setAlasanIzin('');
    setShowIzinModal(true);
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
          ) : existingIzin ? (
            <View
              style={[
                styles.panel,
                lebar && { flex: 1 },
                existingIzin.status === 'disetujui'
                  ? styles.panelOk
                  : existingIzin.status === 'ditolak'
                  ? styles.panelBad
                  : styles.panelWarn,
              ]}
            >
              <Ikon
                nama={
                  existingIzin.status === 'disetujui'
                    ? 'centang'
                    : existingIzin.status === 'ditolak'
                    ? 'kunci'
                    : 'riwayat'
                }
                size={34}
                color={
                  existingIzin.status === 'disetujui'
                    ? W.green
                    : existingIzin.status === 'ditolak'
                    ? W.red
                    : W.amber
                }
              />
              <Text
                style={[
                  styles.panelTitle,
                  {
                    color:
                      existingIzin.status === 'disetujui'
                        ? W.green
                        : existingIzin.status === 'ditolak'
                        ? W.red
                        : W.amber,
                  },
                ]}
              >
                {existingIzin.status === 'disetujui'
                  ? 'Permohonan Izin Disetujui'
                  : existingIzin.status === 'ditolak'
                  ? 'Permohonan Izin Ditolak'
                  : 'Menunggu Persetujuan Asisten'}
              </Text>
              <Text style={styles.panelText}>Alasan: &quot;{existingIzin.alasan}&quot;</Text>
              {!!existingIzin.diprosesOleh && (
                <Text style={styles.asistenNote}>
                  Diproses oleh asisten: {existingIzin.diprosesOleh}
                </Text>
              )}
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
          ) : hasRequestedIzin ? (
            <>
              <Button label="Izin Sudah Diajukan" onPress={() => {}} disabled />
              <Button label="Lihat Detail Pengajuan Izin" variant="ghost" onPress={() => setShowIzinModal(true)} />
            </>
          ) : (
            <>
              <Button
                label={sesi.status === 'dibuka' ? 'Presensi Sekarang' : sesi.status === 'ditutup' ? 'Sesi Ditutup' : 'Presensi Belum Tersedia'}
                variant="success"
                onPress={() => setFormOpen(true)}
                disabled={sesi.status !== 'dibuka'}
              />
              {sesi.status !== 'ditutup' && (
                <Button
                  label="Ajukan Izin Ketidakhadiran"
                  variant="outline"
                  onPress={() => {
                    setErrorIzin(null);
                    setIzinOpen(true);
                  }}
                />
              )}
            </>
          )}
        </View>
      </View>

      {/* Bottom sheet + form konfirmasi presensi */}
      <BottomSheet visible={formOpen} onClose={() => { setFormOpen(false); setErrorMsg(null); }} title="Konfirmasi presensi">
        <View style={styles.summary}>
          <Text style={styles.sumNama}>{praktikan.nama}{praktikan.nim ? ` (${praktikan.nim})` : ''}</Text>
          <Text style={styles.sumSub}>{sesi.nama} • Kelas {sesi.kelas}</Text>
        </View>
        <Pressable onPress={() => setSetuju((v) => !v)} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: setuju }}>
          <View style={[styles.checkbox, setuju && styles.checkboxOn]}>
            {setuju && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkText}>Saya hadir dan mengikuti praktikum di {sesi.ruang}.</Text>
        </Pressable>
        {!!errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
        <Button
          label={submitting ? 'Memproses...' : 'Kirim Presensi'}
          variant="success"
          onPress={handlePresensi}
          disabled={!setuju || submitting || sesi.status !== 'dibuka' || hasAttended}
        />
        <Button label="Batal" variant="ghost" onPress={() => { setFormOpen(false); setErrorMsg(null); }} />
      </BottomSheet>

      {/* Bottom sheet + form pengajuan izin ketidakhadiran (FR-11) */}
      <BottomSheet
        visible={izinOpen}
        onClose={() => {
          setIzinOpen(false);
          setErrorIzin(null);
        }}
        title="Ajukan Izin Ketidakhadiran"
      >
        <View style={styles.summary}>
          <Text style={styles.sumNama}>{praktikan.nama}{praktikan.nim ? ` (${praktikan.nim})` : ''}</Text>
          <Text style={styles.sumSub}>{sesi.nama} • Kelas {sesi.kelas}</Text>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={styles.inputLabel}>Alasan ketidakhadiran</Text>
          <TextInput
            value={alasanIzin}
            onChangeText={(t) => {
              setAlasanIzin(t);
              if (errorIzin) setErrorIzin(null);
            }}
            placeholder="Contoh: Sakit demam dan harus istirahat sesuai surat dokter"
            placeholderTextColor={W.sub}
            style={styles.textArea}
            multiline
            maxLength={300}
          />
        </View>
        {!!errorIzin && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorIzin}</Text>
          </View>
        )}
        <Button
          label={submittingIzin ? 'Mengirim...' : 'Kirim Pengajuan Izin'}
          variant="primary"
          onPress={handleAjukanIzin}
          disabled={submittingIzin || hasAttended || hasRequestedIzin}
        />
        <Button
          label="Batal"
          variant="ghost"
          onPress={() => {
            setIzinOpen(false);
            setErrorIzin(null);
          }}
        />
      </BottomSheet>

      {/* Modal umpan balik & status real-time pengajuan izin (FR-11 & FR-14) */}
      <ConfirmModal
        visible={showIzinModal}
        onClose={() => setShowIzinModal(false)}
        ikon={existingIzin?.status === 'ditolak' ? 'kunci' : 'centang'}
        tone={existingIzin?.status === 'ditolak' ? 'danger' : 'success'}
        title={
          existingIzin?.status === 'disetujui'
            ? 'Izin Telah Disetujui'
            : existingIzin?.status === 'ditolak'
            ? 'Izin Ditolak'
            : 'Pengajuan Izin Terkirim'
        }
        message={
          existingIzin?.status === 'disetujui'
            ? 'Permohonan izin ketidakhadiranmu telah disetujui oleh asisten.'
            : existingIzin?.status === 'ditolak'
            ? 'Permohonan izin ketidakhadiranmu ditolak oleh asisten.'
            : 'Permohonan izin ketidakhadiranmu telah disimpan dan sedang menunggu persetujuan asisten.'
        }
        actions={
          <>
            <View style={styles.dRow}>
              <Text style={styles.dLabel}>Status</Text>
              <Text
                style={[
                  styles.dValue,
                  {
                    color:
                      existingIzin?.status === 'disetujui'
                        ? W.green
                        : existingIzin?.status === 'ditolak'
                        ? W.red
                        : W.amber,
                  },
                ]}
              >
                {existingIzin?.status === 'disetujui'
                  ? 'DISETUJUI'
                  : existingIzin?.status === 'ditolak'
                  ? 'DITOLAK'
                  : 'MENUNGGU PERSETUJUAN'}
              </Text>
            </View>
            <View style={styles.dRow}><Text style={styles.dLabel}>Praktikum</Text><Text style={styles.dValue}>{sesi.nama}</Text></View>
            <View style={styles.dRow}><Text style={styles.dLabel}>Alasan</Text><Text style={styles.dValue}>{existingIzin?.alasan ?? '-'}</Text></View>
            {!!existingIzin?.diprosesOleh && (
              <View style={styles.dRow}><Text style={styles.dLabel}>Diproses oleh</Text><Text style={styles.dValue}>{existingIzin.diprosesOleh}</Text></View>
            )}
            <Button label="Tutup" variant="primary" onPress={() => setShowIzinModal(false)} />
            <Button label="Lihat riwayat & status izin" variant="ghost" onPress={() => { setShowIzinModal(false); router.navigate('/praktikan/riwayat' as never); }} />
          </>
        }
      />

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
            <Button label="Lihat riwayat" variant="ghost" onPress={() => { setShowModal(false); router.navigate('/praktikan/riwayat' as never); }} />
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
  panelWarn: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: W.amber },
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
  errorBox: { backgroundColor: W.redSoft, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: W.red },
  errorText: { color: W.red, fontSize: 13, fontWeight: '600' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: W.text },
  textArea: { minHeight: 88, borderWidth: 1.5, borderColor: W.cardAlt, borderRadius: 12, padding: 12, fontSize: 14, color: W.text, textAlignVertical: 'top', backgroundColor: W.bg },
  dRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  dLabel: { fontSize: 13, color: W.sub },
  dValue: { fontSize: 13, color: W.text, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
});
