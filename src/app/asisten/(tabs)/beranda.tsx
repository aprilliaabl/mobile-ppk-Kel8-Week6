import { View, StyleSheet } from 'react-native';
import { JadwalList } from '../../../features/session/components/JadwalList';
import { HeaderCard, StatBox } from '../../../components/HeaderCard';
import { useSesiList, userDummy } from '../../../constants/dummy';
import { W } from '../../../constants/warna';

export default function BerandaAsisten() {
  const asisten = userDummy.find((u) => u.role === 'asisten')!;
  const sesiList = useSesiList();
  const hitung = (s: string) => sesiList.filter((x) => x.status === s).length;

  return (
    <JadwalList
      role="asisten"
      header={
        <HeaderCard badge="ASISTEN" title={`Halo, ${asisten.nama}`} subtitle="Kelola sesi praktikum dan pantau kehadiran praktikan">
          <View style={styles.stats}>
            <StatBox label="Dibuka" value={hitung('dibuka')} color={W.green} />
            <StatBox label="Belum dibuka" value={hitung('belum_dibuka')} />
            <StatBox label="Selesai" value={hitung('ditutup')} color={W.red} />
          </View>
        </HeaderCard>
      }
    />
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
