import { View, StyleSheet } from 'react-native';
import { JadwalList } from '../../../features/session/components/JadwalList';
import { HeaderCard, StatBox } from '../../../components/HeaderCard';
import { getRekapSesi, useSesiList } from '../../../constants/dummy';
import { useRefreshOnFocus } from '../../../hooks/use-refresh-on-focus';
import { W } from '../../../constants/warna';

/** Riwayat asisten: sesi yang sudah ditutup beserta jumlah kehadirannya. */
export default function RiwayatAsisten() {
  const sesiList = useSesiList();
  useRefreshOnFocus();
  const selesai = sesiList.filter((s) => s.status === 'ditutup');
  const totalHadir = selesai.reduce((n, s) => n + getRekapSesi(s.id).length, 0);

  return (
    <JadwalList
      role="asisten"
      statusTetap="ditutup"
      judul="Sesi yang sudah selesai"
      kosong={{ judul: 'Belum ada sesi yang selesai', deskripsi: 'Sesi yang kamu tutup akan tercatat di sini beserta rekap kehadirannya.' }}
      header={
        <HeaderCard badge="ASISTEN" title="Riwayat Sesi" subtitle="Arsip sesi praktikum yang telah ditutup">
          <View style={styles.stats}>
            <StatBox label="Sesi selesai" value={selesai.length} color={W.red} />
            <StatBox label="Total kehadiran" value={totalHadir} color={W.green} />
          </View>
        </HeaderCard>
      }
    />
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
