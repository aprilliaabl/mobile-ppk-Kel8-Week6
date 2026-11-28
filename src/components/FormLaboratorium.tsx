import { useEffect, useState } from 'react';
import {
  KeyboardTypeOptions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import type { DataLaboratorium, Laboratorium } from '../constants/types';
import { W } from '../constants/warna';

interface Props {
  visible: boolean;
  onClose: () => void;
  laboratorium?: Laboratorium;
  onSubmit: (data: DataLaboratorium) => Promise<void>;
}

interface FormValues {
  nama: string;
  kode: string;
  gedung: string;
  lantai: string;
  latitude: string;
  longitude: string;
  radius: string;
  gracePeriodMinutes: string;
  deskripsi: string;
  mataKuliah: string;
}

export function FormLaboratorium({ visible, onClose, laboratorium, onSubmit }: Props) {
  const { height } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState<FormValues>({
    nama: '',
    kode: '',
    gedung: '',
    lantai: '1',
    latitude: '-7.047909',
    longitude: '110.440866',
    radius: '25',
    gracePeriodMinutes: '15',
    deskripsi: '',
    mataKuliah: '',
  });

  useEffect(() => {
    if (visible) {
      setErrorMsg(null);
      setLoading(false);
      if (laboratorium) {
        setForm({
          nama: laboratorium.nama,
          kode: laboratorium.kode,
          gedung: laboratorium.gedung,
          lantai: String(laboratorium.lantai ?? 1),
          latitude: String(laboratorium.latitude),
          longitude: String(laboratorium.longitude),
          radius: String(laboratorium.radius ?? 25),
          gracePeriodMinutes: String(laboratorium.gracePeriodMinutes ?? 15),
          deskripsi: laboratorium.deskripsi ?? '',
          mataKuliah: laboratorium.mataKuliah ?? '',
        });
      } else {
        setForm({
          nama: '',
          kode: '',
          gedung: '',
          lantai: '1',
          latitude: '-7.047909',
          longitude: '110.440866',
          radius: '25',
          gracePeriodMinutes: '15',
          deskripsi: '',
          mataKuliah: '',
        });
      }
    }
  }, [visible, laboratorium]);

  const setVal = (k: keyof FormValues) => (val: string) => {
    setForm((p) => ({ ...p, [k]: val }));
    if (errorMsg) setErrorMsg(null);
  };

  const simpan = async () => {
    const namaTrim = form.nama.trim();
    const kodeTrim = form.kode.trim().toUpperCase();
    const gedungTrim = form.gedung.trim();
    const latNum = parseFloat(form.latitude.replace(',', '.'));
    const lonNum = parseFloat(form.longitude.replace(',', '.'));
    const radNum = parseFloat(form.radius.replace(',', '.'));
    const graceNum = parseInt(form.gracePeriodMinutes, 10);

    if (!namaTrim) {
      setErrorMsg('Nama laboratorium wajib diisi.');
      return;
    }
    if (!kodeTrim) {
      setErrorMsg('Kode laboratorium wajib diisi (mis. LAB-01).');
      return;
    }
    if (!gedungTrim) {
      setErrorMsg('Nama gedung/lokasi wajib diisi.');
      return;
    }
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setErrorMsg('Latitude harus berupa angka antara -90 dan 90.');
      return;
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      setErrorMsg('Longitude harus berupa angka antara -180 dan 180.');
      return;
    }
    if (isNaN(radNum) || radNum <= 0 || radNum > 1000) {
      setErrorMsg('Radius presensi harus lebih dari 0 dan maksimal 1000 meter.');
      return;
    }
    if (isNaN(graceNum) || graceNum < 0 || graceNum > 120) {
      setErrorMsg('Grace period harus berupa angka 0–120 menit.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const payload: DataLaboratorium = {
        nama: namaTrim,
        kode: kodeTrim,
        gedung: gedungTrim,
        lantai: parseInt(form.lantai, 10) || 1,
        latitude: latNum,
        longitude: lonNum,
        radius: radNum,
        gracePeriodMinutes: graceNum,
        deskripsi: form.deskripsi.trim() || undefined,
        mataKuliah: form.mataKuliah.trim() || undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Gagal menyimpan laboratorium.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    k,
    label,
    placeholder,
    keyboard,
  }: {
    k: keyof FormValues;
    label: string;
    placeholder: string;
    keyboard?: KeyboardTypeOptions;
  }) => (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={form[k]}
        onChangeText={setVal(k)}
        placeholder={placeholder}
        placeholderTextColor={W.sub}
        keyboardType={keyboard}
        autoCapitalize={k === 'kode' ? 'characters' : 'none'}
        style={styles.input}
      />
    </View>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={laboratorium ? 'Ubah data laboratorium' : 'Tambah laboratorium baru'}
    >
      <ScrollView
        style={{ maxHeight: height * 0.58 }}
        contentContainerStyle={{ gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {Field({ k: 'nama', label: 'Nama Laboratorium', placeholder: 'Lab Komputer 1' })}

        <View style={styles.row}>
          {Field({ k: 'kode', label: 'Kode Lab', placeholder: 'LAB-KOM-1' })}
          {Field({ k: 'lantai', label: 'Lantai', placeholder: '1', keyboard: 'number-pad' })}
        </View>

        {Field({ k: 'gedung', label: 'Nama Gedung', placeholder: 'Gedung Informatika' })}

        <View style={styles.row}>
          {Field({
            k: 'latitude',
            label: 'Latitude',
            placeholder: '-6.973000',
            keyboard: 'numbers-and-punctuation',
          })}
          {Field({
            k: 'longitude',
            label: 'Longitude',
            placeholder: '107.630000',
            keyboard: 'numbers-and-punctuation',
          })}
        </View>

        <Text style={styles.seksi}>KONFIGURASI OPERASIONAL</Text>
        {Field({
          k: 'radius',
          label: 'Cakupan Lokasi Presensi / Radius (Meter)',
          placeholder: '25',
          keyboard: 'numeric',
        })}

        {Field({
          k: 'gracePeriodMinutes',
          label: 'Grace Period Keterlambatan (Menit)',
          placeholder: '15',
          keyboard: 'numeric',
        })}

        <Text style={styles.seksi}>INFORMASI TAMBAHAN</Text>
        {Field({ k: 'mataKuliah', label: 'Mata Kuliah', placeholder: 'Basis Data' })}
        {Field({ k: 'deskripsi', label: 'Deskripsi', placeholder: 'Keterangan singkat laboratorium' })}

        {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      </ScrollView>

      <Button label={loading ? 'Menyimpan...' : 'Simpan Laboratorium'} onPress={simpan} disabled={loading} />
      <Button label="Batal" variant="ghost" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 13, fontWeight: '700', color: W.text, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: W.cardAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: W.text,
    backgroundColor: W.bg,
  },
  seksi: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: W.sub, marginTop: 4 },
  error: { fontSize: 13, color: W.red, fontWeight: '600' },
});
