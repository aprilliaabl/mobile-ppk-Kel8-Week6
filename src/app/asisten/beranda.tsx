import { View, Text, StyleSheet } from 'react-native';
import { JadwalList } from '../../features/session/components/JadwalList';
import { sesiDummy, userDummy } from '../../constants/dummy';

export default function BerandaAsisten() {
  const asisten = userDummy.find((u) => u.role === 'asisten')!;
  return (
    <View style={styles.container}>
      <Text style={styles.sapaan}>Halo, {asisten.nama} (Asisten)</Text>
      <JadwalList sesiList={sesiDummy} role="asisten" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  sapaan: { fontSize: 15, color: '#374151', paddingHorizontal: 16, paddingTop: 16 },
});