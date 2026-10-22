import { View, Text, StyleSheet } from 'react-native';
import { JadwalList } from '../../features/session/components/JadwalList';
import { sesiDummy, userDummy } from '../../constants/dummy';

export default function BerandaPraktikan() {
  const praktikan = userDummy.find((u) => u.role === 'praktikan')!;
  return (
    <View style={styles.container}>
      <Text style={styles.sapaan}>Halo, {praktikan.nama} (Praktikan)</Text>
      <JadwalList sesiList={sesiDummy} role="praktikan" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  sapaan: { fontSize: 15, color: '#374151', paddingHorizontal: 16, paddingTop: 16 },
});