import { FlatList, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Sesi } from '../../../constants/types';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatRentangWaktu } from '../../../constants/format';

export function JadwalList({ sesiList, role }: { sesiList: Sesi[], role: 'asisten' | 'praktikan' }) {
  const router = useRouter();

  return (
    <FlatList
      data={sesiList}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Belum ada jadwal praktikum</Text>
          <Text style={styles.emptySub}>Jadwal akan muncul di sini setelah ditambahkan.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/${role}/sesi/${item.id}` as any)}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.left}>
                <Text style={styles.nama}>{item.nama}</Text>
                <Text style={styles.kelas}>{item.kelas}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.waktu}>{formatRentangWaktu(item.waktuMulai, item.waktuSelesai)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  left: { flex: 1, marginRight: 12 },
  nama: { fontSize: 16, fontWeight: '700', color: '#111827' },
  kelas: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  waktu: { fontSize: 13, color: '#374151', marginTop: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
});