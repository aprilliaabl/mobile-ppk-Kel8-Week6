import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Button } from './Button';
import { W } from '../constants/warna';

/** Tampilan saat data sedang dimuat. */
export function LoadingState({ teks = 'Memuat data...' }: { teks?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={W.blue} />
      <Text style={styles.teks}>{teks}</Text>
    </View>
  );
}

/** Tampilan saat data gagal dimuat (mis. koneksi terputus), dengan tombol coba lagi. */
export function ErrorState({ pesan, onCoba }: { pesan: string; onCoba?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.judul}>Terjadi gangguan</Text>
      <Text style={styles.teks}>{pesan}</Text>
      {onCoba && <View style={{ alignSelf: 'stretch', marginTop: 8 }}><Button label="Coba Lagi" variant="outline" onPress={onCoba} /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 },
  judul: { fontSize: 16, fontWeight: '800', color: W.red },
  teks: { fontSize: 13, color: W.sub, textAlign: 'center', lineHeight: 19 },
});
