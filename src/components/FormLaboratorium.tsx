import { useEffect, useState } from 'react';
import {
  Alert,
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
  deskripsi: string;
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
    radius: '10',
    deskripsi: '',
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
          radius: String(laboratorium.radius ?? 10),
          deskripsi: laboratorium.deskripsi ?? '',
        });
      } else {
        setForm({
          nama: '',
          kode: '',
          gedung: 'Gedung E FSM Undip',
          lantai: '2',
          latitude: '-7.047909',
          longitude: '110.440866',
          radius: '10',
          deskripsi: '',
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
    const latNum = parseFloat(form.latitude);
    const lonNum = parseFloat(form.longitude);
    const radNum = parseFloat(form.radius);

    if (!namaTrim) {
      Alert.alert('Peringatan', 'Nama laboratorium wajib diisi.');
      return;
    }
    if (!kodeTrim) {
      Alert.alert('Peringatan', 'Kode laboratorium wajib diisi (mis. LAB-01).');
      return;
    }
    if (!gedungTrim) {
      Alert.alert('Peringatan', 'Nama gedung/lokasi wajib diisi.');
      return;
    }
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      Alert.alert('Peringatan', 'Latitude harus berupa angka antara -90 dan 90.');
      return;
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      Alert.alert('Peringatan', 'Longitude harus berupa angka antara -180 dan 180.');
      return;
    }
    if (isNaN(radNum) || radNum <= 0) {
      Alert.alert('Peringatan', 'Radius toleransi harus berupa angka lebih besar dari 0.');
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
        deskripsi: form.deskripsi.trim() || undefined,
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

        {Field({
          k: 'radius',
          label: 'Radius Toleransi Presensi (Meter)',
          placeholder: '25',
          keyboard: 'numeric',
        })}

        {Field({
          k: 'deskripsi',
          label: 'Deskripsi / Matakuliah yang Diajar',
          placeholder: 'Praktikum Algoritma, Basis Data, dll.',
        })}

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
  error: { fontSize: 13, color: W.red, fontWeight: '600' },
});
