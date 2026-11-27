import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { EmptyState } from '../../../components/EmptyState';
import { HeaderCard } from '../../../components/HeaderCard';
import { Ikon } from '../../../components/Ikon';
import { InfoRow } from '../../../components/InfoRow';
import { PetaLokasiPresensi } from '../../../components/PetaLokasiPresensi';
import { ErrorState, LoadingState } from '../../../components/StateView';
import { StatusBadge } from '../../../components/StatusBadge';
import { muatUlangSesi, sesiBerkaitan, useSesiList, useSesiStatus } from '../../../constants/sesiStore';
import { useCurrentUser } from '../../../hooks/use-current-user';
import {
  formatJamRentang,
  formatTanggal,
  formatTanggalPanjang,
} from '../../../constants/format';
import { useIzinSesiPraktikan } from '../../../constants/izinStore';
import {
  cariLaboratoriumSesi,
  useLaboratoriumList,
} from '../../../constants/laboratorium';
import {
  cekSudahPresensi,
  submitPresensi,
  usePresensiPraktikanSesi,
} from '../../../constants/presensiStore';
import { validasiSyaratPresensi } from '../../../constants/validasiPresensi';
import { MAX_W, W } from '../../../constants/warna';
import { useLokasiPresensi } from '../../../hooks/use-lokasi-presensi';

/**
 * FR-17 & FR-18: Halaman Presensi Khusus dengan Validasi Sesi, Lokasi (GPS & MapView),
 * dan Pencegahan Presensi Ganda.
 */
export default function HalamanPresensiPraktikan() {
  const { sesiId: paramSesiId } = useLocalSearchParams<{ sesiId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const lebar = width >= 820;

  const praktikan = useCurrentUser('praktikan');
  const semuaSesi = useSesiList();
  const statusSesi = useSesiStatus();
  const daftarLab = useLaboratoriumList();

  const {
    statusLokasi,
    koordinat,
    errorDetail,
    canAskAgain,
    segarkanLokasi,
    bukaPengaturanIzin,
  } = useLokasiPresensi();

  // Filter hanya sesi yang berkaitan dengan kelas praktikan (FR-06)
  const sesiKelas = useMemo(
    () =>
      semuaSesi
        .filter((s) => sesiBerkaitan(s, praktikan))
        .sort((a, b) => a.waktuMulai.localeCompare(b.waktuMulai)),
    [semuaSesi, praktikan]
  );

  const [manualId, setManualId] = useState<string | null>(null);
  const [lastParamId, setLastParamId] = useState<string | undefined>(
    paramSesiId
  );
  const [setuju, setSetuju] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (paramSesiId !== lastParamId) {
    setLastParamId(paramSesiId);
    setManualId(null);
    setErrorMsg(null);
  }

  const selectedId = manualId ?? paramSesiId ?? '';

  // Tentukan sesi aktif yang sedang dipilih
  const sesi = useMemo(() => {
    if (selectedId) {
      const dariSemua = semuaSesi.find((s) => s.id === selectedId);
      if (dariSemua) return dariSemua;
    }
    return (
      sesiKelas.find(
        (s) => s.status === 'dibuka' && !cekSudahPresensi(s.id, praktikan.id)
      ) ??
      sesiKelas.find((s) => s.status === 'dibuka') ??
      sesiKelas[0]
    );
  }, [selectedId, semuaSesi, sesiKelas, praktikan.id]);

  const catatanHadir = usePresensiPraktikanSesi(sesi?.id, praktikan.id);
  const catatanIzin = useIzinSesiPraktikan(sesi?.id, praktikan.id);
  const lab = useMemo(
    () => cariLaboratoriumSesi(sesi, daftarLab),
    [sesi, daftarLab]
  );

  const sudahHadir = !!catatanHadir;
  const sudahIzin = !!catatanIzin;
  const milikKelas = sesi ? sesiBerkaitan(sesi, praktikan) : true;

  // FR-18: Evaluasi 3 syarat presensi (Sesi, Lokasi/Radius, dan Status Kehadiran)
  const validasi = useMemo(
    () =>
      validasiSyaratPresensi({
        sesi,
        praktikan,
        sudahPresensi: sudahHadir,
        waktuHadir: catatanHadir?.waktuKehadiran,
        statusLokasi,
        koordinat,
        daftarLab,
        errorLokasiDetail: errorDetail,
      }),
    [
      sesi,
      praktikan,
      sudahHadir,
      catatanHadir?.waktuKehadiran,
      statusLokasi,
      koordinat,
      daftarLab,
      errorDetail,
    ]
  );

  const pilihSesi = (id: string) => {
    setManualId(id);
    setSetuju(false);
    setErrorMsg(null);
  };

  const handleKirimPresensi = async () => {
    if (!sesi || !setuju || submitting) return;
    setErrorMsg(null);

    if (!validasi.bolehPresensi) {
      setErrorMsg(
        validasi.ringkasanError ??
          'Syarat presensi belum terpenuhi. Periksa status sesi dan lokasi perangkat.'
      );
      return;
    }

    setSubmitting(true);
    const hasil = await submitPresensi({
      sesi,
      praktikan,
      lokasi: validasi.hasilLokasi.infoLokasiPresensi,
      requireLokasi: true,
    });
    setSubmitting(false);

    if (!hasil.ok) {
      setErrorMsg(hasil.error ?? 'Presensi tidak dapat diproses.');
      return;
    }

    setSetuju(false);
    setShowSuccessModal(true);
  };

  if (statusSesi.loading && semuaSesi.length === 0) {
    return (
      <View style={[styles.root, styles.center]}>
        <LoadingState teks="Memuat data sesi presensi..." />
      </View>
    );
  }

  if (statusSesi.error && semuaSesi.length === 0) {
    return (
      <View style={[styles.root, styles.center]}>
        <ErrorState pesan={statusSesi.error} onCoba={muatUlangSesi} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>
        <HeaderCard
          badge="HALAMAN PRESENSI"
          title="Presensi Praktikum"
          subtitle={`${praktikan.nama}${
            praktikan.nim ? ` (${praktikan.nim})` : ''
          } • Kelas ${praktikan.kelas ?? '-'}`}
        >
          {sesiKelas.length > 0 && (
            <>
              <Text style={styles.label}>PILIH SESI PRAKTIKUM</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {sesiKelas.map((item) => {
                  const aktif = item.id === sesi?.id;
                  const hadirItem = !!cekSudahPresensi(item.id, praktikan.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => pilihSesi(item.id)}
                      style={[
                        styles.chip,
                        aktif && styles.chipAktif,
                        !aktif && item.status === 'dibuka' && styles.chipBuka,
                      ]}
                      accessibilityRole="button"
                    >
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: hadirItem
                              ? W.green
                              : item.status === 'dibuka'
                              ? W.green
                              : item.status === 'ditutup'
                              ? W.red
                              : W.sub,
                          },
                        ]}
                      />
                      <Text
                        style={[styles.chipText, aktif && styles.chipTextAktif]}
                      >
                        {item.nama.replace('Praktikum ', '')} (
                        {formatTanggal(item.waktuMulai)})
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}
        </HeaderCard>

        {!sesi ? (
          <View style={styles.card}>
            <EmptyState
              ikon="kosong"
              judul="Belum ada sesi untuk dipresensi"
              deskripsi={
                praktikan.kelas
                  ? `Belum ada jadwal praktikum yang terdaftar untuk kelas ${praktikan.kelas}.`
                  : 'Jadwal sesi praktikum akan muncul di sini setelah ditambahkan oleh asisten.'
              }
            />
          </View>
        ) : !milikKelas ? (
          <View style={styles.card}>
            <EmptyState
              ikon="kunci"
              judul="Sesi ini bukan untuk kelasmu"
              deskripsi={`Sesi ${sesi.nama} adalah untuk kelas ${sesi.kelas}, sedangkan kamu terdaftar di kelas ${praktikan.kelas}.`}
            />
            <Button
              label="Pilih Sesi Kelas Saya"
              variant="outline"
              onPress={() => setManualId('')}
            />
          </View>
        ) : (
          <View style={[styles.columns, lebar && styles.columnsWide]}>
            {/* Kolom Kiri: Ringkasan Sesi, Peta Lokasi & Geofence Laboratorium */}
            <View style={[styles.card, lebar && { flex: 1 }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionBadge}>SESI & LABORATORIUM</Text>
                  <Text style={styles.sesiTitle}>{sesi.nama}</Text>
                </View>
                <StatusBadge status={sesi.status} />
              </View>

              <InfoRow ikon="grup" label="Kelas" value={sesi.kelas} />
              <InfoRow
                ikon="jadwal"
                label="Tanggal"
                value={formatTanggalPanjang(sesi.waktuMulai)}
              />
              <InfoRow
                ikon="jam"
                label="Waktu"
                value={formatJamRentang(sesi.waktuMulai, sesi.waktuSelesai)}
              />
              <InfoRow
                ikon="lokasi"
                label="Laboratorium"
                value={
                  lab
                    ? `${lab.nama} (Radius maks. ${lab.radius}m)`
                    : sesi.ruang
                }
              />

              {!!sesi.catatan && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>CATATAN ASISTEN</Text>
                  <Text style={styles.noteText}>{sesi.catatan}</Text>
                </View>
              )}

              {/* Peta Google Maps / Radar Geofence (FR-18) */}
              <View style={styles.mapSection}>
                <View style={styles.mapHeaderRow}>
                  <Text style={styles.sectionBadge}>
                    PETA RADIUS LABORATORIUM
                  </Text>
                  <Pressable
                    onPress={() => {
                      void segarkanLokasi();
                    }}
                    style={styles.refreshBtn}
                    accessibilityRole="button"
                  >
                    <Ikon nama="segarkan" size={13} color={W.blue} />
                    <Text style={styles.refreshText}>Segarkan GPS</Text>
                  </Pressable>
                </View>

                <PetaLokasiPresensi
                  laboratorium={lab}
                  koordinatPerangkat={validasi.hasilLokasi.koordinat}
                  jarakMeter={validasi.hasilLokasi.jarakMeter}
                  dalamRadius={validasi.hasilLokasi.dalamRadius}
                />
              </View>

              <Button
                label="Lihat Halaman Detail Sesi"
                variant="outline"
                onPress={() =>
                  router.push(`/praktikan/sesi/${sesi.id}` as never)
                }
              />
            </View>

            {/* Kolom Kanan: Checklist Validasi FR-18 & Eksekusi Presensi */}
            <View style={[styles.card, lebar && { flex: 1 }]}>
              <Text style={styles.sectionBadge}>
                HASIL PEMERIKSAAN SYARAT PRESENSI
              </Text>

              {/* Checklist 3 Kondisi Wajib FR-18 */}
              <View style={styles.checkListBox}>
                {/* 1. Validasi Sesi */}
                <ChecklistItem
                  judul="1. Status Sesi Praktikum"
                  deskripsi={validasi.pesanSesi}
                  status={
                    validasi.sesiValid
                      ? 'valid'
                      : sesi.status === 'belum_dibuka'
                      ? 'pending'
                      : 'invalid'
                  }
                />

                {/* 2. Validasi Lokasi & Radius */}
                <ChecklistItem
                  judul="2. Validasi Lokasi & Radius Laboratorium"
                  deskripsi={
                    validasi.hasilLokasi.status === 'berhasil'
                      ? `Lokasi berhasil diperoleh. ${validasi.pesanLokasi}`
                      : validasi.pesanLokasi
                  }
                  status={
                    statusLokasi === 'memuat'
                      ? 'loading'
                      : validasi.lokasiValid
                      ? 'valid'
                      : 'invalid'
                  }
                />

                {/* 3. Validasi Kehadiran */}
                <ChecklistItem
                  judul="3. Status Kehadiran Praktikan"
                  deskripsi={validasi.pesanPresensi}
                  status={validasi.belumPresensi ? 'valid' : 'done'}
                />
              </View>

              {/* Aksi Pemulihan Permission / GPS apabila lokasi bermasalah */}
              {statusLokasi === 'izin_ditolak' && (
                <View style={styles.permActionBox}>
                  <Text style={styles.permActionText}>
                    Akses lokasi diperlukan untuk memastikan kamu berada di dalam
                    radius {lab?.nama ?? sesi.ruang}.
                  </Text>
                  <View style={styles.permBtnRow}>
                    {canAskAgain && (
                      <View style={{ flex: 1 }}>
                        <Button
                          label="Berikan Izin Lokasi"
                          variant="primary"
                          onPress={() => void segarkanLokasi()}
                        />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Buka Pengaturan"
                        variant="outline"
                        onPress={() => void bukaPengaturanIzin()}
                      />
                    </View>
                  </View>
                </View>
              )}

              {(statusLokasi === 'gps_mati' ||
                statusLokasi === 'gagal' ||
                statusLokasi === 'akurasi_buruk') && (
                <Button
                  label="Coba Ambil Lokasi Lagi"
                  variant="outline"
                  onPress={() => void segarkanLokasi()}
                />
              )}

              {/* Panel Status Akhir & Tombol Submit */}
              {sudahHadir ? (
                <View style={[styles.statusPanel, styles.panelOk]}>
                  <Ikon nama="centang" size={38} color={W.green} />
                  <Text style={[styles.panelTitle, { color: W.green }]}>
                    Presensi Berhasil Tercatat
                  </Text>
                  <Text style={styles.panelDesc}>
                    Pengguna sudah melakukan presensi pada pukul{' '}
                    <Text style={{ color: W.text, fontWeight: '800' }}>
                      {catatanHadir.waktuKehadiran} WIB
                    </Text>{' '}
                    ({catatanHadir.tanggal})
                    {catatanHadir.lokasi
                      ? ` • Jarak ${catatanHadir.lokasi.jarakMeter}m dari ${
                          catatanHadir.lokasi.namaLab ?? sesi.ruang
                        }`
                      : ''}
                    .
                  </Text>
                  <View style={{ alignSelf: 'stretch', marginTop: 8, gap: 8 }}>
                    <Button
                      label="Lihat Bukti Kehadiran"
                      variant="success"
                      onPress={() => setShowSuccessModal(true)}
                    />
                    <Button
                      label="Buka Riwayat Kehadiran"
                      variant="ghost"
                      onPress={() =>
                        router.navigate('/praktikan/riwayat' as never)
                      }
                    />
                  </View>
                </View>
              ) : sudahIzin ? (
                <View style={[styles.statusPanel, styles.panelWarn]}>
                  <Ikon nama="riwayat" size={36} color={W.amber} />
                  <Text style={[styles.panelTitle, { color: W.amber }]}>
                    Permohonan Izin Tercatat (
                    {catatanIzin.status.toUpperCase()})
                  </Text>
                  <Text style={styles.panelDesc}>
                    Kamu telah mengajukan izin ketidakhadiran untuk sesi ini
                    dengan alasan: &quot;{catatanIzin.alasan}&quot;.
                  </Text>
                  <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
                    <Button
                      label="Lihat Detail di Halaman Sesi"
                      variant="outline"
                      onPress={() =>
                        router.push(`/praktikan/sesi/${sesi.id}` as never)
                      }
                    />
                  </View>
                </View>
              ) : sesi.status === 'belum_dibuka' ? (
                <View style={styles.statusPanel}>
                  <Ikon nama="kunci" size={34} color={W.sub} />
                  <Text style={styles.panelTitle}>Sesi Belum Dibuka</Text>
                  <Text style={styles.panelDesc}>
                    Tunggu asisten membuka sesi praktikum. Status sesi di atas
                    akan otomatis berubah secara real-time saat sesi dibuka.
                  </Text>
                </View>
              ) : sesi.status === 'ditutup' ? (
                <View style={[styles.statusPanel, styles.panelBad]}>
                  <Ikon nama="kunci" size={34} color={W.red} />
                  <Text style={[styles.panelTitle, { color: W.red }]}>
                    Sesi Sudah Ditutup
                  </Text>
                  <Text style={styles.panelDesc}>
                    Presensi tidak dapat dilakukan karena sesi praktikum telah
                    ditutup oleh asisten.
                  </Text>
                </View>
              ) : !validasi.lokasiValid ? (
                <View style={[styles.statusPanel, styles.panelBad]}>
                  <Ikon nama="peringatan" size={34} color={W.red} />
                  <Text style={[styles.panelTitle, { color: W.red }]}>
                    Syarat Lokasi Belum Terpenuhi
                  </Text>
                  <Text style={styles.panelDesc}>{validasi.pesanLokasi}</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.statusPanel, styles.panelOk]}>
                    <Ikon nama="centang" size={32} color={W.green} />
                    <Text style={[styles.panelTitle, { color: W.green }]}>
                      Seluruh Syarat Presensi Terpenuhi
                    </Text>
                    <Text style={styles.panelDesc}>
                      Sesi sedang dibuka dan perangkat berada dalam radius{' '}
                      {lab?.nama ?? sesi.ruang} (
                      {validasi.hasilLokasi.jarakMeter}m / maks.{' '}
                      {lab?.radius ?? 100}m).
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setSetuju((v) => !v)}
                    style={styles.checkRow}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: setuju }}
                  >
                    <View
                      style={[styles.checkbox, setuju && styles.checkboxOn]}
                    >
                      {setuju && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <Text style={styles.checkText}>
                      Saya menyatakan hadir secara fisik dan mengikuti praktikum{' '}
                      {sesi.nama} di {sesi.ruang}.
                    </Text>
                  </Pressable>

                  {!!errorMsg && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                  )}

                  <Button
                    label={
                      submitting
                        ? 'Memproses Presensi...'
                        : 'Kirim Presensi Sekarang'
                    }
                    variant="success"
                    onPress={handleKirimPresensi}
                    disabled={
                      !setuju || submitting || !validasi.bolehPresensi
                    }
                  />
                </>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Modal Bukti Kehadiran */}
      {sesi && (
        <ConfirmModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          ikon="centang"
          tone="success"
          title="Presensi Berhasil"
          message="Data kehadiran dan verifikasi lokasi laboratorium telah tersimpan."
          actions={
            <>
              <View style={styles.dRow}>
                <Text style={styles.dLabel}>Nama Praktikan</Text>
                <Text style={styles.dValue}>
                  {praktikan.nama} ({praktikan.nim ?? '-'})
                </Text>
              </View>
              <View style={styles.dRow}>
                <Text style={styles.dLabel}>Praktikum</Text>
                <Text style={styles.dValue}>{sesi.nama}</Text>
              </View>
              <View style={styles.dRow}>
                <Text style={styles.dLabel}>Kelas / Ruang</Text>
                <Text style={styles.dValue}>
                  {sesi.kelas} • {sesi.ruang}
                </Text>
              </View>
              {catatanHadir?.lokasi && (
                <View style={styles.dRow}>
                  <Text style={styles.dLabel}>Jarak Lokasi</Text>
                  <Text style={[styles.dValue, { color: W.green }]}>
                    {catatanHadir.lokasi.jarakMeter}m (Radius{' '}
                    {catatanHadir.lokasi.radiusMeter}m)
                  </Text>
                </View>
              )}
              <View style={styles.dRow}>
                <Text style={styles.dLabel}>Waktu Kehadiran</Text>
                <Text style={[styles.dValue, { color: W.green }]}>
                  {catatanHadir?.waktuKehadiran ?? '-'} WIB
                </Text>
              </View>
              <Button
                label="Tutup"
                variant="success"
                onPress={() => setShowSuccessModal(false)}
              />
              <Button
                label="Lihat Riwayat Presensi"
                variant="ghost"
                onPress={() => {
                  setShowSuccessModal(false);
                  router.navigate('/praktikan/riwayat' as never);
                }}
              />
            </>
          }
        />
      )}
    </ScrollView>
  );
}

function ChecklistItem({
  judul,
  deskripsi,
  status,
}: {
  judul: string;
  deskripsi: string;
  status: 'valid' | 'invalid' | 'pending' | 'loading' | 'done';
}) {
  const palette =
    status === 'valid' || status === 'done'
      ? { fg: W.green, bg: W.greenSoft, badge: status === 'done' ? 'TERCATAT' : 'TERPENUHI' }
      : status === 'loading'
      ? { fg: W.blue, bg: W.blueSoft, badge: 'MEMERIKSA' }
      : status === 'pending'
      ? { fg: W.amber, bg: 'rgba(245,158,11,0.16)', badge: 'MENUNGGU' }
      : { fg: W.red, bg: W.redSoft, badge: 'DITOLAK' };

  return (
    <View style={styles.checkItem}>
      <View style={styles.checkItemTop}>
        <Text style={styles.checkItemTitle}>{judul}</Text>
        <View style={[styles.checkBadge, { backgroundColor: palette.bg }]}>
          {status === 'loading' ? (
            <ActivityIndicator size="small" color={palette.fg} />
          ) : (
            <Text style={[styles.checkBadgeText, { color: palette.fg }]}>
              {palette.badge}
            </Text>
          )}
        </View>
      </View>
      <Text style={[styles.checkItemDesc, { color: palette.fg }]}>
        {deskripsi}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: W.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, flexGrow: 1 },
  inner: { width: '100%', maxWidth: MAX_W, alignSelf: 'center', gap: 14 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: W.sub,
    marginTop: 14,
    marginBottom: 6,
  },
  chipsRow: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: W.cardAlt,
    borderWidth: 1,
    borderColor: W.line,
  },
  chipAktif: { backgroundColor: W.blue, borderColor: W.blue },
  chipBuka: { borderColor: W.green },
  chipText: { fontSize: 13, fontWeight: '700', color: W.sub },
  chipTextAktif: { color: '#FFFFFF' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  columns: { gap: 14 },
  columnsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  card: {
    backgroundColor: W.card,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: W.line,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: W.blue,
  },
  sesiTitle: { fontSize: 20, fontWeight: '800', color: W.text, marginTop: 4 },
  noteBox: {
    backgroundColor: W.cardAlt,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: W.sub,
    letterSpacing: 0.5,
  },
  noteText: { fontSize: 13, color: W.text, lineHeight: 19 },
  mapSection: { gap: 10, marginTop: 4 },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: W.blueSoft,
  },
  refreshText: { fontSize: 11, fontWeight: '800', color: W.blue },
  checkListBox: { gap: 10 },
  checkItem: {
    backgroundColor: W.bg,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: W.line,
  },
  checkItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  checkItemTitle: { fontSize: 13, fontWeight: '800', color: W.text, flex: 1 },
  checkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 68,
    alignItems: 'center',
  },
  checkBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  checkItemDesc: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  permActionBox: {
    backgroundColor: W.cardAlt,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  permActionText: { fontSize: 12, color: W.text, lineHeight: 18 },
  permBtnRow: { flexDirection: 'row', gap: 8 },
  statusPanel: {
    backgroundColor: W.bg,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: W.line,
  },
  panelOk: { backgroundColor: W.greenSoft, borderColor: W.green },
  panelWarn: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: W.amber },
  panelBad: { backgroundColor: W.redSoft, borderColor: W.red },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: W.text,
    textAlign: 'center',
  },
  panelDesc: {
    fontSize: 13,
    color: W.sub,
    textAlign: 'center',
    lineHeight: 19,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: W.sub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: W.green, borderColor: W.green },
  checkMark: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  checkText: { flex: 1, fontSize: 14, color: W.text, lineHeight: 20 },
  errorBox: {
    backgroundColor: W.redSoft,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: W.red,
  },
  errorText: { color: W.red, fontSize: 13, fontWeight: '600' },
  dRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  dLabel: { fontSize: 13, color: W.sub },
  dValue: {
    fontSize: 13,
    color: W.text,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
});
