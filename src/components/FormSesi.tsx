import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, useWindowDimensions, KeyboardTypeOptions } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { DataSesi, Sesi } from '../constants/types';
import { ErrorSesi, FormSesiValues, dariSesi, formKosong, keDataSesi, validasiSesi } from '../constants/validasiSesi';
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
  const [v, setV] = useState<FormSesiValues>(formKosong());
  const [err, setErr] = useState<ErrorSesi>({});
  const [loading, setLoading] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  // Isi ulang form setiap kali dibuka
  useEffect(() => {
    if (visible) {
      setV(sesi ? dariSesi(sesi) : formKosong());
      setErr({});
      setGagal(null);
      setLoading(false);
    }
  }, [visible, sesi]);

  const set = (k: keyof FormSesiValues) => (t: string) => {
    setV((p) => ({ ...p, [k]: t }));
    if (err[k]) setErr((p) => ({ ...p, [k]: undefined }));
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
        value={v[k]}
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
      <ScrollView style={{ maxHeight: height * 0.55 }} contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
        {Field({ k: 'nama', label: 'Nama praktikum', placeholder: 'Praktikum Basis Data' })}
        <View style={styles.row}>
          {Field({ k: 'kelas', label: 'Kelas', placeholder: 'IF-2B' })}
          {Field({ k: 'ruang', label: 'Ruang', placeholder: 'Lab Komputer 3' })}
        </View>
        {Field({ k: 'tanggal', label: 'Tanggal (YYYY-MM-DD)', placeholder: '2026-11-20', keyboard: 'numbers-and-punctuation' })}
        <View style={styles.row}>
          {Field({ k: 'jamMulai', label: 'Jam mulai (HH:MM)', placeholder: '08:30', keyboard: 'numbers-and-punctuation' })}
          {Field({ k: 'jamSelesai', label: 'Jam selesai (HH:MM)', placeholder: '10:30', keyboard: 'numbers-and-punctuation' })}
        </View>
        {Field({ k: 'jumlahPeserta', label: 'Jumlah peserta', placeholder: '24', keyboard: 'number-pad' })}
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
});
