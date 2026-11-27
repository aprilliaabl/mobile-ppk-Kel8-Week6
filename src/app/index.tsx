import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { Ikon } from '../components/Ikon';
import { LoadingState } from '../components/StateView';
import { inisial } from '../constants/format';
import { W, warnaAvatar } from '../constants/warna';
import { useAuth, type UserRole } from '../contexts/AuthContext';

const DESKRIPSI: Record<UserRole, { judul: string; teks: string; warna: string }> = {
  asisten: {
    judul: 'Asisten',
    teks: 'Kelola laboratorium, anggota, sesi praktikum, dan pantau rekap kehadiran serta izin.',
    warna: W.blue,
  },
  praktikan: {
    judul: 'Praktikan',
    teks: 'Lihat jadwal, presensi di lokasi laboratorium, ajukan izin, dan cek riwayat kehadiran.',
    warna: W.green,
  },
};

/** Pintu masuk aplikasi: login/daftar, pemilihan peran (bila punya dua), atau langsung ke beranda sesuai peran. */
export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, loading, activeRole, setActiveRole, logout } = useAuth();

  if (loading) {
    return (
      <View style={styles.tengah}>
        <LoadingState teks="Menyiapkan aplikasi..." />
      </View>
    );
  }

  if (currentUser && activeRole) {
    return <Redirect href={(activeRole === 'asisten' ? '/asisten/dashboard' : '/praktikan/beranda') as never} />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 28 }]}
    >
      <View style={styles.inner}>
        <View style={styles.logo}>
          <Ikon nama="centang" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Presensi Praktikum</Text>
        <Text style={styles.subtitle}>Presensi berbasis lokasi dan pengelolaan laboratorium Informatika</Text>

        {!currentUser ? (
          <View style={styles.kartu}>
            <Text style={styles.kartuJudul}>Mulai</Text>
            <Text style={styles.desc}>Masuk dengan akunmu, atau daftar bila belum punya. Satu akun bisa menjadi praktikan sekaligus asisten.</Text>
            <Button label="Masuk" onPress={() => router.push('/login' as never)} />
            <Button label="Daftar Akun Baru" variant="outline" onPress={() => router.push('/register' as never)} />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <View style={styles.salam}>
              <View style={[styles.avatar, { backgroundColor: warnaAvatar(currentUser.uid) }]}>
                <Text style={styles.avatarText}>{inisial(currentUser.nama)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nama}>Halo, {currentUser.nama}</Text>
                <Text style={styles.desc}>Kamu terdaftar sebagai asisten dan praktikan. Pilih peran untuk sesi ini.</Text>
              </View>
            </View>
            {currentUser.roles.map((r) => (
              <Pressable
                key={r}
                onPress={() => setActiveRole(r)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.kartu, { borderColor: DESKRIPSI[r].warna }, pressed && { opacity: 0.85 }]}
              >
                <Text style={[styles.kartuJudul, { color: DESKRIPSI[r].warna }]}>Masuk sebagai {DESKRIPSI[r].judul}</Text>
                <Text style={styles.desc}>{DESKRIPSI[r].teks}</Text>
              </Pressable>
            ))}
            <Button label="Keluar dari akun" variant="ghost" onPress={() => void logout()} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tengah: { flex: 1, backgroundColor: W.bg, justifyContent: 'center' },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  inner: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 8 },
  logo: { width: 76, height: 76, borderRadius: 24, backgroundColor: W.blue, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 28, fontWeight: '800', color: W.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: W.sub, textAlign: 'center', marginBottom: 22, lineHeight: 20 },
  kartu: { backgroundColor: W.card, borderRadius: 22, padding: 20, gap: 12, borderWidth: 1, borderColor: W.line },
  kartuJudul: { fontSize: 18, fontWeight: '800', color: W.text },
  desc: { fontSize: 14, color: W.sub, lineHeight: 20 },
  salam: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: W.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: W.line },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  nama: { fontSize: 17, fontWeight: '800', color: W.text, marginBottom: 2 },
});
