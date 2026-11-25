import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { HeaderCard } from './HeaderCard';
import { Button } from './Button';
import { auth } from '../config/firebase';
import { hapusCacheSesi } from '../constants/cacheSesi';
import { resetCurrentUserToDemo, resetDemo, useCurrentUser } from '../constants/dummy';
import { inisial } from '../constants/format';
import { W, warnaAvatar } from '../constants/warna';

/** Tab "Akun": identitas, ganti peran, dan reset data demo. */
export function AkunPanel({ role }: { role: 'asisten' | 'praktikan' }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser(role);

  const handleKeluar = async () => {
    try {
      if (auth?.currentUser) {
        await signOut(auth);
      }
    } catch {
      // tetap lanjutkan keluar meskipun offline
    }
    await hapusCacheSesi();
    resetCurrentUserToDemo();
    router.replace('/');
  };

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
              <Text style={styles.sub}>{role === 'asisten' ? 'Asisten praktikum' : `Praktikan • ${user.kelas ?? 'IF-2B'}`}</Text>
            </View>
          </View>
        </HeaderCard>

        <View style={styles.card}>
          <Text style={styles.judul}>Pindah peran / keluar</Text>
          <Text style={styles.desc}>Kembali ke halaman awal untuk masuk dengan akun lain atau berganti peran.</Text>
          <Button label="Ganti peran / keluar akun" variant="outline" onPress={handleKeluar} />
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
