import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderCard } from './HeaderCard';
import { Button } from './Button';
import { resetDemo, userDummy } from '../constants/dummy';
import { inisial } from '../constants/format';
import { MAX_W, W, warnaAvatar } from '../constants/warna';

/** Tab "Akun": identitas, ganti peran, dan reset data demo. */
export function AkunPanel({ role }: { role: 'asisten' | 'praktikan' }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = userDummy.find((u) => u.role === role)!;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}
    >
      <View style={styles.inner}>
        <HeaderCard badge={role === 'asisten' ? 'ASISTEN' : 'PRAKTIKAN'} title="Akun" subtitle="Kelola identitas dan data demo">
          <View style={styles.profil}>
            <View style={[styles.avatar, { backgroundColor: warnaAvatar(user.id) }]}>
              <Text style={styles.avatarText}>{inisial(user.nama)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nama}>{user.nama}</Text>
              <Text style={styles.sub}>{role === 'asisten' ? 'Asisten praktikum' : 'Praktikan • IF-2B'}</Text>
            </View>
          </View>
        </HeaderCard>

        <View style={styles.card}>
          <Text style={styles.judul}>Pindah peran</Text>
          <Text style={styles.desc}>Kembali ke halaman awal untuk masuk sebagai peran lain. Data sesi dan presensi tetap tersimpan selama aplikasi berjalan.</Text>
          <Button label="Ganti peran / identitas" variant="outline" onPress={() => router.replace('/')} />
        </View>

        <View style={styles.card}>
          <Text style={styles.judul}>Data demo</Text>
          <Text style={styles.desc}>Kembalikan semua sesi dan catatan presensi ke kondisi awal untuk mengulang demo.</Text>
          <Button label="Reset data demo" variant="danger" onPress={resetDemo} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, flexGrow: 1 },
  inner: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 14 },
  profil: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, backgroundColor: W.cardAlt, borderRadius: 14, padding: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  nama: { fontSize: 17, fontWeight: '800', color: W.text },
  sub: { fontSize: 13, color: W.sub, marginTop: 2 },
  card: { backgroundColor: W.card, borderRadius: 20, padding: 18, gap: 12, borderWidth: 1, borderColor: W.line },
  judul: { fontSize: 16, fontWeight: '800', color: W.text },
  desc: { fontSize: 13, color: W.sub, lineHeight: 19 },
});
