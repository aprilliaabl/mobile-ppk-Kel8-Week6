import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { sesiDummy } from '../../../constants/dummy';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatRentangWaktu } from '../../../constants/format';

export default function DetailSesiPraktikan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sesi = sesiDummy.find((s) => s.id === id);

  if (!sesi) return <View style={styles.center}><Text>Sesi tidak ditemukan.</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.nama}>{sesi.nama}</Text>
        <StatusBadge status={sesi.status} />
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.label}>Kelas</Text>
        <Text style={styles.value}>{sesi.kelas}</Text>
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.label}>Waktu</Text>
        <Text style={styles.value}>{formatRentangWaktu(sesi.waktuMulai, sesi.waktuSelesai)}</Text>
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.label}>Status Sesi</Text>
        <Text style={styles.value}>
          {sesi.status === 'belum_dibuka'
            ? 'Sesi belum dibuka oleh asisten. Silakan tunggu.'
            : sesi.status === 'dibuka'
            ? 'Sesi sedang dibuka. Kamu dapat melakukan presensi.'
            : 'Sesi telah ditutup.'}
        </Text>
      </View>
      
      {sesi.status === 'belum_dibuka' && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Tombol presensi belum aktif.</Text>
        </View>
      )}
      {sesi.status === 'dibuka' && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Area Tombol Presensi</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F9FAFB', flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  nama: { fontSize: 20, fontWeight: '800', color: '#111827', flex: 1, marginRight: 12 },
  infoBox: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 12 },
  label: { fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#111827', marginTop: 4 },
  placeholder: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D1D5DB', borderRadius: 12, padding: 16, marginTop: 8 },
  placeholderText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});