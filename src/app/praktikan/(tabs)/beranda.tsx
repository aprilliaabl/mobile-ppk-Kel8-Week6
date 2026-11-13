import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { JadwalList } from '../../../features/session/components/JadwalList';
import { HeaderCard, StatBox } from '../../../components/HeaderCard';
import { useSesiList, userDummy } from '../../../constants/dummy';
import { cekSudahPresensi, useRiwayatPraktikan } from '../../../constants/presensiStore';
import { useRefreshOnFocus } from '../../../hooks/use-refresh-on-focus';
import { W } from '../../../constants/warna';

export default function BerandaPraktikan() {
  const router = useRouter();
  const praktikan = userDummy.find((u) => u.role === 'praktikan')!;
  const sesiList = useSesiList();
  const riwayat = useRiwayatPraktikan(praktikan.id);
  useRefreshOnFocus();

  const jumlahHadir = riwayat.length;
  const perluPresensi = sesiList.find((s) => s.status === 'dibuka' && !cekSudahPresensi(s.id, praktikan.id));

  return (
    <JadwalList
      role="praktikan"
      header={
        <View style={{ gap: 12 }}>
          <HeaderCard badge="PRAKTIKAN" title={`Halo, ${praktikan.nama}`} subtitle="Lihat jadwal, lakukan presensi, dan cek catatan kehadiranmu">
            <View style={styles.stats}>
              <StatBox label="Presensi tercatat" value={jumlahHadir} color={W.green} />
              <StatBox label="Sesi dibuka" value={sesiList.filter((s) => s.status === 'dibuka').length} />
            </View>
          </HeaderCard>

          {perluPresensi && (
            <Pressable
              onPress={() => router.push(`/praktikan/sesi/${perluPresensi.id}` as never)}
              style={({ pressed }) => [styles.banner, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Sesi sedang dibuka</Text>
                <Text style={styles.bannerSub} numberOfLines={1}>{perluPresensi.nama} • ketuk untuk presensi</Text>
              </View>
            </Pressable>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: W.greenSoft, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: W.green },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: W.green },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: W.green },
  bannerSub: { fontSize: 13, color: W.sub, marginTop: 2 },
});
