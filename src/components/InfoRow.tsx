import { View, Text, StyleSheet } from 'react-native';
import { Ikon, NamaIkon } from './Ikon';
import { W } from '../constants/warna';

export function InfoRow({ ikon, label, value }: { ikon: NamaIkon; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.ikon}><Ikon nama={ikon} size={18} color={W.blue} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ikon: { width: 38, height: 38, borderRadius: 11, backgroundColor: W.blueSoft, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, color: W.sub },
  value: { fontSize: 15, fontWeight: '600', color: W.text, marginTop: 1 },
});
