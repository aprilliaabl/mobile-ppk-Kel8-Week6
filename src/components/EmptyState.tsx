import { View, Text, StyleSheet } from 'react-native';
import { Ikon, NamaIkon } from './Ikon';
import { W } from '../constants/warna';

export function EmptyState({ ikon, judul, deskripsi }: { ikon: NamaIkon; judul: string; deskripsi: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}><Ikon nama={ikon} size={32} color={W.sub} /></View>
      <Text style={styles.judul}>{judul}</Text>
      <Text style={styles.desk}>{deskripsi}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  circle: { width: 72, height: 72, borderRadius: 36, backgroundColor: W.cardAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  judul: { fontSize: 16, fontWeight: '700', color: W.text, textAlign: 'center' },
  desk: { fontSize: 13, color: W.sub, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
