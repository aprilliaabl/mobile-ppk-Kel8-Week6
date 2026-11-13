import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Sesi } from '../constants/types';
import { hapusSesi, ubahSesi } from '../constants/dummy';
import { Button } from './Button';
import { FormSesi } from './FormSesi';
import { ConfirmModal } from './ConfirmModal';

/** Tombol Ubah dan Hapus sesi (khusus asisten), lengkap dengan form dan konfirmasi hapus. */
export function AksiSesi({ sesi }: { sesi: Sesi }) {
  const router = useRouter();
  const [ubahOpen, setUbahOpen] = useState(false);
  const [hapusOpen, setHapusOpen] = useState(false);
  const [hapusGagal, setHapusGagal] = useState<string | null>(null);

  const hapus = async () => {
    try {
      await hapusSesi(sesi.id);
      setHapusOpen(false);
      router.back();
    } catch {
      setHapusGagal('Gagal menghapus sesi. Periksa koneksi lalu coba lagi.');
    }
  };

  return (
    <>
      <View style={styles.row}>
        <View style={{ flex: 1 }}><Button label="Ubah" variant="outline" onPress={() => setUbahOpen(true)} /></View>
        <View style={{ flex: 1 }}><Button label="Hapus" variant="danger" onPress={() => { setHapusGagal(null); setHapusOpen(true); }} /></View>
      </View>

      <FormSesi visible={ubahOpen} onClose={() => setUbahOpen(false)} sesi={sesi} onSubmit={(data) => ubahSesi(sesi.id, data)} />

      <ConfirmModal
        visible={hapusOpen}
        onClose={() => setHapusOpen(false)}
        ikon="kunci"
        tone="danger"
        title="Hapus sesi ini?"
        message={hapusGagal ?? `${sesi.nama} (${sesi.kelas}) akan dihapus dan tidak dapat dikembalikan.`}
        actions={
          <>
            <Button label="Ya, hapus sesi" variant="danger" onPress={hapus} />
            <Button label="Batal" variant="ghost" onPress={() => setHapusOpen(false)} />
          </>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
});
