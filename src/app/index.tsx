import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Ikon } from '../components/Ikon';
import { resetDemo, userDummy } from '../constants/dummy';
import { inisial } from '../constants/format';
import { W, warnaAvatar } from '../constants/warna';

export default function PilihRole() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const lebar = width >= 760;

  const asisten = userDummy.find((u) => u.role === 'asisten')!;
  const praktikan = userDummy.find((u) => u.role === 'praktikan')!;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 28 }]}
    >
      <View style={styles.inner}>
        <View style={styles.logo}><Ikon nama="centang" size={36} color="#FFFFFF" /></View>
        <Text style={styles.title}>Presensi Praktikum</Text>
        <Text style={styles.subtitle}>Pilih peran untuk memulai demo alur praktikum</Text>

        <View style={[styles.cards, lebar && styles.cardsRow]}>
          {/* Kartu Asisten */}
          <View style={[styles.kartu, lebar && { flex: 1 }]}>
            <View style={styles.kartuHead}>
              <View style={[styles.avatar, { backgroundColor: warnaAvatar(asisten.id) }]}>
                <Text style={styles.avatarText}>{inisial(asisten.nama)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nama}>{asisten.nama}</Text>
                <View style={styles.pill}><Text style={styles.pillText}>ASISTEN</Text></View>
              </View>
            </View>
            <Text style={styles.desc}>Lihat jadwal, buka dan tutup sesi lewat Dashboard, serta pantau rekap kehadiran praktikan.</Text>
            <Button label="Masuk sebagai Asisten" onPress={() => router.replace('/asisten/beranda')} />

          </View>

          {/* Kartu Praktikan */}
          <View style={[styles.kartu, lebar && { flex: 1 }]}>
            <View style={styles.kartuHead}>
              <View style={[styles.avatar, { backgroundColor: warnaAvatar(praktikan.id) }]}>
                <Text style={styles.avatarText}>{inisial(praktikan.nama)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nama}>{praktikan.nama}</Text>
                <View style={[styles.pill, { backgroundColor: W.greenSoft }]}>
                  <Text style={[styles.pillText, { color: W.green }]}>PRAKTIKAN</Text>
                </View>
              </View>
            </View>
            <Text style={styles.desc}>Lihat jadwal, lakukan presensi saat sesi dibuka, dan cek riwayat kehadiran.</Text>
            <Button label="Masuk sebagai Praktikan" variant="success" onPress={() => router.replace('/praktikan/beranda')} />
          </View>
        </View>

        <Button label="Reset data demo" variant="ghost" onPress={resetDemo} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  inner: { width: '100%', maxWidth: 860, alignSelf: 'center', gap: 6 },
  logo: { width: 76, height: 76, borderRadius: 24, backgroundColor: W.blue, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 28, fontWeight: '800', color: W.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: W.sub, textAlign: 'center', marginBottom: 26 },
  cards: { gap: 14, marginBottom: 8 },
  cardsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  kartu: { backgroundColor: W.card, borderRadius: 24, padding: 20, gap: 14, borderWidth: 1, borderColor: W.line },
  kartuHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  nama: { fontSize: 20, fontWeight: '800', color: W.text },
  pill: { alignSelf: 'flex-start', backgroundColor: W.blueSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  pillText: { color: W.blue, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  desc: { fontSize: 14, color: W.sub, lineHeight: 20 },
});
