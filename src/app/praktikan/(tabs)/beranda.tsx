import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HeaderCard, StatBox } from '../../../components/HeaderCard';
import { JadwalLaboratoriumSection } from '../../../components/JadwalLaboratoriumSection';
import { useSesiPraktikan } from '../../../constants/sesiStore';
import { useCurrentUser } from '../../../hooks/use-current-user';
import { useRiwayatIzinPraktikan } from '../../../constants/izinStore';
import { useAuth } from '../../../contexts/AuthContext';
import { cekSudahPresensi, useRiwayatPraktikan } from '../../../constants/presensiStore';
import { W } from '../../../constants/warna';
import { JadwalList } from '../../../features/session/components/JadwalList';
import { useRefreshOnFocus } from '../../../hooks/use-refresh-on-focus';

export default function BerandaPraktikan() {
  const router = useRouter();
  const praktikan = useCurrentUser('praktikan');
  const sesiList = useSesiPraktikan(praktikan); // hanya sesi untuk kelas praktikan (FR-06)
  const riwayat = useRiwayatPraktikan(praktikan.id);
  const izinSaya = useRiwayatIzinPraktikan(praktikan.id);
  const { keanggotaan } = useAuth();
  useRefreshOnFocus();

  const jumlahHadir = riwayat.length;
  // Persentase dihitung dari sesi kelasnya yang sudah dibuka atau selesai (sesi yang belum dibuka belum bisa dihadiri).
  const sesiBerjalan = sesiList.filter((s) => s.status !== 'belum_dibuka');
  const hadirDiSesiKelas = sesiBerjalan.filter((s) => cekSudahPresensi(s.id, praktikan.id)).length;
  const persenHadir = sesiBerjalan.length > 0 ? Math.round((hadirDiSesiKelas / sesiBerjalan.length) * 100) : 0;
  const izinMenunggu = izinSaya.filter((i) => i.status === 'pending').length;
  const belumTerdaftar = (praktikan.kelasList?.length ?? 0) === 0;
  const perluPresensi = sesiList.find((s) => s.status === 'dibuka' && !cekSudahPresensi(s.id, praktikan.id));

  return (
    <JadwalList
      role="praktikan"
      judul={praktikan.kelas ? `Jadwal Kelas ${praktikan.kelas}` : 'Jadwal Praktikum'}
      header={
        <View style={{ gap: 12 }}>
          <HeaderCard
            badge="PRAKTIKAN"
            title={`Halo, ${praktikan.nama}`}
            subtitle={praktikan.kelas ? `Kelas ${praktikan.kelas} • lihat jadwal dan lakukan presensi` : 'Lihat jadwal, lakukan presensi, dan cek catatan kehadiranmu'}
          >
            <View style={styles.stats}>
              <StatBox label="Kehadiran" value={`${persenHadir}%`} color={W.green} />
              <StatBox label="Presensi" value={jumlahHadir} />
              <StatBox label="Sesi dibuka" value={sesiList.filter((s) => s.status === 'dibuka').length} />
            </View>
            <View style={styles.stats}>
              <StatBox label="Izin menunggu" value={izinMenunggu} color={izinMenunggu > 0 ? W.amber : W.text} />
              <StatBox label="Laboratorium" value={keanggotaan.filter((a) => a.role === 'praktikan').length} />
            </View>
          </HeaderCard>

          {belumTerdaftar && (
            <View style={styles.info}>
              <Text style={styles.infoJudul}>Belum terdaftar di kelas mana pun</Text>
              <Text style={styles.infoSub}>Jadwal muncul setelah aslab memasukkanmu ke laboratorium. Berikan NIM-mu ({praktikan.nim ?? 'belum diisi'}) kepada aslab.</Text>
            </View>
          )}

          {perluPresensi && (
            <Pressable
              onPress={() => router.push({ pathname: '/praktikan/presensi', params: { sesiId: perluPresensi.id } } as never)}
              style={({ pressed }) => [styles.banner, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Sesi sedang dibuka</Text>
                <Text style={styles.bannerSub} numberOfLines={1}>{perluPresensi.nama} • ketuk untuk buka halaman presensi</Text>
              </View>
            </Pressable>
          )}

          <JadwalLaboratoriumSection daftarSesi={sesiList} role="praktikan" />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: W.greenSoft, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: W.green },
  info: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: W.amber, gap: 4 },
  infoJudul: { fontSize: 14, fontWeight: '800', color: W.amber },
  infoSub: { fontSize: 13, color: W.sub, lineHeight: 18 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: W.green },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: W.green },
  bannerSub: { fontSize: 13, color: W.sub, marginTop: 2 },
});