
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { userDummy } from '../constants/dummy';

export default function PilihRole() {
  const router = useRouter();

  const asisten = userDummy.find((u) => u.role === 'asisten')!;
  const praktikan = userDummy.find((u) => u.role === 'praktikan')!;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Presensi Praktikum</Text>
      <Text style={styles.subtitle}>
        Pilih peran untuk melanjutkan
      </Text>

      {/* Kartu Asisten */}
      <View style={styles.kartu}>
        <Text style={styles.nama}>{asisten.nama}</Text>
        <Text style={styles.role}>Asisten</Text>

        <Button
          label="Masuk sebagai Asisten"
          onPress={() => router.push('/asisten/beranda')}
        />

        <Pressable
          style={({ pressed }) => [
            styles.dashboardCard,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/dashboard')}
        >
          <Text style={styles.dashboardTitle}>
            Buka Dashboard Asisten →
          </Text>
          <Text style={styles.dashboardSubtitle}>
            Modul Pengelolaan Sesi Praktikum & Rekap Kehadiran
          </Text>
        </Pressable>
      </View>

      {/* Kartu Praktikan */}
      <View style={styles.kartu}>
        <Text style={styles.nama}>{praktikan.nama}</Text>
        <Text style={styles.role}>Praktikan</Text>

        <Button
          label="Masuk sebagai Praktikan"
          variant="outline"
          onPress={() => router.push('/praktikan/beranda')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  kartu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  nama: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  role: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 16,
  },
  dashboardCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  dashboardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3730A3',
  },
  dashboardSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 5,
  },
  pressed: {
    opacity: 0.7,
  },
});