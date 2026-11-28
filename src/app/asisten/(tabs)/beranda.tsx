import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../../components/Button';
import { FormSesi } from '../../../components/FormSesi';
import { JadwalLaboratoriumSection } from '../../../components/JadwalLaboratoriumSection';
import { Lipat, RingkasStat } from '../../../components/Ringkas';
import { tambahSesi, useSesiList } from '../../../constants/sesiStore';
import { W } from '../../../constants/warna';
import { JadwalList } from '../../../features/session/components/JadwalList';

/** Tab Jadwal asisten: ringkasan satu baris, tombol tambah sesi, status per lab (dilipat), lalu daftar sesi. */
export default function JadwalAsisten() {
  const sesiList = useSesiList();
  const [formOpen, setFormOpen] = useState(false);
  const hitung = (s: string) => sesiList.filter((x) => x.status === s).length;

  return (
    <>
      <JadwalList
        role="asisten"
        judul="Daftar Sesi"
        header={
          <View style={styles.header}>
            <RingkasStat
              items={[
                { label: 'Dibuka', value: hitung('dibuka'), color: W.green },
                { label: 'Belum dibuka', value: hitung('belum_dibuka') },
                { label: 'Selesai', value: hitung('ditutup'), color: W.red },
              ]}
            />
            <Button label="+ Tambah Sesi" onPress={() => setFormOpen(true)} />
            <Lipat judul="Status per laboratorium" info="berlangsung & berikutnya">
              <JadwalLaboratoriumSection daftarSesi={sesiList} role="asisten" />
            </Lipat>
          </View>
        }
      />
      <FormSesi visible={formOpen} onClose={() => setFormOpen(false)} onSubmit={async (data) => { await tambahSesi(data); }} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10 },
});
