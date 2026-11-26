import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { FormLaboratorium } from '../../../components/FormLaboratorium';
import { HeaderCard } from '../../../components/HeaderCard';
import {
  hapusLaboratorium,
  tambahLaboratorium,
  ubahLaboratorium,
  useLaboratoriumList,
} from '../../../constants/laboratoriumStore';
import type { DataLaboratorium, Laboratorium } from '../../../constants/types';
import { W } from '../../../constants/warna';

export default function KelolaLaboratoriumScreen() {
  const insets = useSafeAreaInsets();
  const labList = useLaboratoriumList();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState<Laboratorium | undefined>(undefined);

  const handleTambah = () => {
    setSelectedLab(undefined);
    setFormOpen(true);
  };

  const handleEdit = (lab: Laboratorium) => {
    setSelectedLab(lab);
    setFormOpen(true);
  };

  const handleHapus = (lab: Laboratorium) => {
    Alert.alert(
      'Hapus Laboratorium',
      `Yakin ingin menghapus ${lab.nama} (${lab.kode})? Data yang terhubung mungkin akan terpengaruh.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await hapusLaboratorium(lab.id);
            } catch (err) {
              Alert.alert('Gagal Menghapus', (err as Error).message);
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async (data: DataLaboratorium) => {
    if (selectedLab) {
      await ubahLaboratorium(selectedLab.id, data);
    } else {
      await tambahLaboratorium(data);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <FlatList
        data={labList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={
          <HeaderCard
            badge="MASTER DATA"
            title="Kelola Laboratorium"
            subtitle="Atur koordinat dan radius lokasi laboratorium Informatika"
          >
            <View style={{ marginTop: 12 }}>
              <Button label="+ Tambah Laboratorium Baru" onPress={handleTambah} />
            </View>
          </HeaderCard>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.namaLab}>{item.nama}</Text>
                <Text style={styles.kodeLab}>
                  {item.kode} • Lantai {item.lantai ?? 1}
                </Text>
              </View>
              <View style={styles.radiusBadge}>
                <Text style={styles.radiusText}>{item.radius ?? 25} meter</Text>
              </View>
            </View>

            <Text style={styles.gedung}>{item.gedung}</Text>

            <View style={styles.configRow}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Radius Presensi</Text>
                <Text style={styles.configValue}>{item.radius} meter</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Grace Period</Text>
                <Text style={styles.configValue}>{item.gracePeriodMinutes} menit</Text>
              </View>
            </View>

            <View style={styles.geoRow}>
              <Text style={styles.geoLabel}>📍 Koordinat:</Text>
              <Text style={styles.geoValue}>
                {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
              </Text>
            </View>

            {!!item.deskripsi && <Text style={styles.deskripsi}>{item.deskripsi}</Text>}

            <View style={styles.actionRow}>
              <Pressable style={styles.editBtn} onPress={() => handleEdit(item)}>
                <Text style={styles.editBtnText}>Ubah</Text>
              </Pressable>
              <Pressable style={styles.deleteBtn} onPress={() => handleHapus(item)}>
                <Text style={styles.deleteBtnText}>Hapus</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <FormLaboratorium
        visible={formOpen}
        laboratorium={selectedLab}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: W.bg },
  listContent: { paddingHorizontal: 16, gap: 14 },
  card: {
    backgroundColor: W.card,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: W.line,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  namaLab: { fontSize: 16, fontWeight: '800', color: W.text },
  kodeLab: { fontSize: 13, color: W.blue, fontWeight: '700', marginTop: 2 },
  radiusBadge: {
    backgroundColor: W.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  radiusText: { color: W.green, fontSize: 11, fontWeight: '800' },
  gedung: { fontSize: 13, color: W.sub },
  configRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  configItem: {
    flex: 1,
    backgroundColor: W.cardAlt,
    padding: 9,
    borderRadius: 8,
  },
  configLabel: { fontSize: 10, color: W.sub, fontWeight: '700' },
  configValue: { fontSize: 12, color: W.text, fontWeight: '800', marginTop: 2 },
  geoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: W.cardAlt,
    padding: 8,
    borderRadius: 8,
  },
  geoLabel: { fontSize: 12, fontWeight: '700', color: W.sub },
  geoValue: { fontSize: 12, color: W.text, fontWeight: '600' },
  deskripsi: { fontSize: 12, color: W.sub, fontStyle: 'italic', marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: W.line,
    paddingTop: 10,
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: W.blueSoft,
    borderRadius: 8,
  },
  editBtnText: { color: W.blue, fontSize: 13, fontWeight: '700' },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  deleteBtnText: { color: W.red, fontSize: 13, fontWeight: '700' },
});
