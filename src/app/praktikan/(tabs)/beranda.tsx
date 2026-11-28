import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ikon } from '../../../components/Ikon';
import { JadwalLaboratoriumSection } from '../../../components/JadwalLaboratoriumSection';
import { Lipat, RingkasStat, Sapaan } from '../../../components/Ringkas';
import { useRiwayatIzinPraktikan } from '../../../constants/izinStore';
import { cekSudahPresensi, useRiwayatPraktikan } from '../../../constants/presensiStore';
import { useSesiPraktikan } from '../../../constants/sesiStore';
import { W } from '../../../constants/warna';
import { JadwalList } from '../../../features/session/components/JadwalList';
import { useCurrentUser } from '../../../hooks/use-current-user';
import { useRefreshOnFocus } from '../../../hooks/use-refresh-on-focus';

/** Beranda praktikan: sapaan, ringkasan satu baris, aksi presensi bila ada sesi dibuka, lalu jadwal kelas. */
export default function BerandaPraktikan() {
  const router = useRouter();
  const praktikan = useCurrentUser('praktikan');
  const sesiList = useSesiPraktikan(praktikan); // hanya sesi untuk kelas praktikan (FR-06)
  const riwayat = useRiwayatPraktikan(praktikan.id);
  const izinSaya = useRiwayatIzinPraktikan(praktikan.id);
  useRefreshOnFocus();

  // Persentase dihitung dari sesi kelasnya yang sudah dibuka atau selesai.
  const sesiBerjalan = sesiList.filter((s) => s.status !== 'belum_dibuka');
  const hadirDiSesiKelas = sesiBerjalan.filter((s) => cekSudahPresensi(s.id, praktikan.id)).length;
  const persenHadir = sesiBerjalan.length > 0 ? Math.round((hadirDiSesiKelas / sesiBerjalan.length) * 100) : 0;
  const izinMenunggu = izinSaya.filter((i) => i.status === 'pending').length;
  const sesiDibuka = sesiList.filter((s) => s.status === 'dibuka').length;
  const belumTerdaftar = (praktikan.kelasList?.length ?? 0) === 0;
  const perluPresensi = sesiList.find((s) => s.status === 'dibuka' && !cekSudahPresensi(s.id, praktikan.id));

  return (
    <JadwalList
      role="praktikan"
      judul="Jadwal Kelasmu"
      header={
        <View style={styles.header}>
          <Sapaan
            judul={`Halo, ${praktikan.nama.split(' ')[0] || praktikan.nama}`}
            keterangan={praktikan.kelas ? `Kelas ${praktikan.kelasList?.join(', ')}` : 'Belum terdaftar di kelas'}
            kanan={
              <Pressable onPress={() => router.push('/praktikan/peta' as never)} accessibilityRole="button" accessibilityLabel="Peta laboratorium" style={styles.petaBtn}>
                <Ikon nama="peta" size={18} color={W.blue} />
                <Text style={styles.petaText}>Peta</Text>
              </Pressable>
            }
          />

          <RingkasStat
            items={[
              { label: 'Kehadiran', value: `${persenHadir}%`, color: W.green },
              { label: 'Presensi', value: riwayat.length },
              { label: 'Dibuka', value: sesiDibuka },
              { label: 'Izin', value: izinMenunggu, color: izinMenunggu > 0 ? W.amber : W.text },
            ]}
          />

          {belumTerdaftar && (
            <View style={styles.info}>
              <Text style={styles.infoJudul}>Belum terdaftar di kelas mana pun</Text>
              <Text style={styles.infoSub}>Jadwal muncul setelah aslab memasukkanmu ke laboratorium. Berikan NIM-mu ({praktikan.nim ?? 'belum diisi'}) ke aslab.</Text>
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
                <Text style={styles.bannerSub} numberOfLines={1}>{perluPresensi.nama} • ketuk untuk presensi</Text>
              </View>
              <Ikon nama="panah" size={14} color={W.green} />
            </Pressable>
          )}

          <Lipat judul="Status per laboratorium" info="berlangsung & berikutnya">
            <JadwalLaboratoriumSection daftarSesi={sesiList} role="praktikan" />
          </Lipat>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: 10 },
  petaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: W.blueSoft, paddingHorizontal: 12, minHeight: 44, borderRadius: 12 },
  petaText: { fontSize: 13, fontWeight: '700', color: W.blue },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: W.greenSoft, borderRadius: 14, paddingHorizontal: 14, minHeight: 56, borderWidth: 1, borderColor: W.green },
  info: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: W.amber, gap: 2 },
  infoJudul: { fontSize: 13, fontWeight: '800', color: W.amber },
  infoSub: { fontSize: 12, color: W.sub, lineHeight: 17 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: W.green },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: W.green },
  bannerSub: { fontSize: 12, color: W.sub, marginTop: 1 },
});
