import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, useWindowDimensions, KeyboardTypeOptions, Pressable } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { DataSesi, Sesi } from '../constants/types';
import { ErrorSesi, FormSesiValues, dariSesi, formKosong, keDataSesi, validasiSesi } from '../constants/validasiSesi';
import { useLaboratoriumList } from '../constants/laboratoriumStore';
import { W } from '../constants/warna';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Jika diisi, form berada pada mode ubah. Jika kosong, mode tambah. */
  sesi?: Sesi;
  /** Dipanggil saat data valid. Lempar error agar pesan gagal tampil di form. */
  onSubmit: (data: DataSesi) => Promise<void>;
}

export function FormSesi({ visible, onClose, sesi, onSubmit }: Props) {
  const { height } = useWindowDimensions();
  const [v, setV] = useState<FormSesiValues>(() => (sesi ? dariSesi(sesi) : formKosong()));
  const [err, setErr] = useState<ErrorSesi>({});
  const [loading, setLoading] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);
  const [wasVisible, setWasVisible] = useState(false);

  const labList = useLaboratoriumList();

  // Isi ulang form setiap kali dibuka
  if (visible && !wasVisible) {
    setWasVisible(true);
    setV(sesi ? dariSesi(sesi) : formKosong());
    setErr({});
    setGagal(null);
    setLoading(false);
  } else if (!visible && wasVisible) {
    setWasVisible(false);
  }

  const set = (k: keyof FormSesiValues) => (t: string) => {
    setV((p) => ({ ...p, [k]: t }));
    if (err[k]) setErr((p) => ({ ...p, [k]: undefined }));
  };

  const pilihLab = (labId: string) => {
    const selected = labList.find((l) => l.id === labId);
    if (selected) {
      setV((p) => ({
        ...p,
        laboratoriumId: selected.id,
        ruang: selected.nama,
        latitude: selected.latitude,
        longitude: selected.longitude,
        radius: selected.radius ?? 25,
      }));
      if (err.ruang) setErr((p) => ({ ...p, ruang: undefined }));
    }
  };

  const simpan = async () => {
    const e = validasiSesi(v);
    setErr(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    setGagal(null);
    try {
      await onSubmit(keDataSesi(v));
      onClose();
    } catch (ex) {
      setGagal(ex instanceof Error ? ex.message : 'Gagal menyimpan sesi. Periksa koneksi lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ k, label, placeholder, keyboard }: { k: keyof FormSesiValues; label: string; placeholder: string; keyboard?: KeyboardTypeOptions }) => (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={v[k]?.toString()}
        onChangeText={set(k)}
        placeholder={placeholder}
        placeholderTextColor={W.sub}
        keyboardType={keyboard}
        autoCapitalize="none"
        style={[styles.input, !!err[k] && styles.inputError]}
      />
      {!!err[k] && <Text style={styles.error}>{err[k]}</Text>}
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title={sesi ? 'Ubah sesi praktikum' : 'Tambah sesi praktikum'}>
      <ScrollView style={{ maxHeight: height * 0.58 }} contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">
        {Field({ k: 'nama', label: 'Nama praktikum', placeholder: 'Praktikum Basis Data' })}

        <View style={styles.row}>
          {Field({ k: 'kelas', label: 'Kelas', placeholder: 'IF-2B' })}
          {Field({ k: 'jumlahPeserta', label: 'Jumlah peserta', placeholder: '24', keyboard: 'number-pad' })}
        </View>

        {/* Pilihan Laboratorium Terintegrasi (FR-19) */}
        <View>
          <Text style={styles.label}>Pilih Laboratorium (Acuan Lokasi Presensi)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.labPills}>
            {labList.map((lab) => {
              const aktif = v.laboratoriumId === lab.id || v.ruang === lab.nama;
              return (
                <Pressable
                  key={lab.id}
                  onPress={() => pilihLab(lab.id)}
                  style={[styles.labPill, aktif && styles.labPillAktif]}
                >
                  <Text style={[styles.labPillText, aktif && styles.labPillTextAktif]}>
                    {lab.kode || lab.nama}
                  </Text>
                  <Text style={[styles.labPillSub, aktif && styles.labPillSubAktif]}>
                    r: {lab.radius}m
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {Field({ k: 'ruang', label: 'Nama Ruangan / Lokasi', placeholder: 'Pilih lab di atas atau ketik manual' })}

        {/* Info Lokasi Koordinat Terpilih */}
        {v.latitude !== undefined && v.longitude !== undefined && (
          <View style={styles.geoInfo}>
            <Text style={styles.geoText}>
              📍 Koordinat: {v.latitude.toFixed(6)}, {v.longitude.toFixed(6)} • Radius: {v.radius ?? 25} meter
            </Text>
          </View>
        )}

        {Field({ k: 'tanggal', label: 'Tanggal (YYYY-MM-DD)', placeholder: '2026-11-20', keyboard: 'numbers-and-punctuation' })}

        <View style={styles.row}>
          {Field({ k: 'jamMulai', label: 'Jam mulai (HH:MM)', placeholder: '08:30', keyboard: 'numbers-and-punctuation' })}
          {Field({ k: 'jamSelesai', label: 'Jam selesai (HH:MM)', placeholder: '10:30', keyboard: 'numbers-and-punctuation' })}
        </View>

        {!!gagal && <Text style={styles.gagal}>{gagal}</Text>}
      </ScrollView>
      <Button label={loading ? 'Menyimpan...' : 'Simpan'} onPress={simpan} disabled={loading} />
      <Button label="Batal" variant="ghost" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 13, fontWeight: '700', color: W.text, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: W.cardAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: W.text, backgroundColor: W.bg },
  inputError: { borderColor: W.red },
  error: { fontSize: 12, color: W.red, marginTop: 4 },
  gagal: { fontSize: 13, color: W.red, fontWeight: '600' },
  labPills: { gap: 8, paddingVertical: 4 },
  labPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: W.cardAlt,
    borderWidth: 1.5,
    borderColor: W.line,
    alignItems: 'center',
  },
  labPillAktif: {
    backgroundColor: W.blueSoft,
    borderColor: W.blue,
  },
  labPillText: { fontSize: 13, fontWeight: '700', color: W.sub },
  labPillTextAktif: { color: W.blue },
  labPillSub: { fontSize: 10, color: W.sub, marginTop: 2 },
  labPillSubAktif: { color: W.blue, fontWeight: '700' },
  geoInfo: {
    backgroundColor: W.cardAlt,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: W.green,
  },
  geoText: { fontSize: 12, color: W.green, fontWeight: '600' },
});