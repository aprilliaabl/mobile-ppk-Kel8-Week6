import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_W, W } from '../../../constants/warna';
import { DistribusiPanel } from './distribusi';
import { LaboratoriumPanel } from './laboratorium';

type Segmen = 'laboratorium' | 'anggota';

/** Tab Kelola: menggabungkan pengelolaan laboratorium dan anggota/impor dalam satu tempat. */
export default function KelolaAsisten() {
  const insets = useSafeAreaInsets();
  const { seg } = useLocalSearchParams<{ seg?: string }>();
  const [segmen, setSegmen] = useState<Segmen>(seg === 'anggota' ? 'anggota' : 'laboratorium');

  // Pintasan dari Beranda dapat menentukan segmen yang dibuka.
  useEffect(() => {
    if (seg === 'anggota' || seg === 'laboratorium') setSegmen(seg);
  }, [seg]);

  return (
    <View style={{ flex: 1, backgroundColor: W.bg }}>
      <View style={[styles.bar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.segmen} accessibilityRole="tablist">
          {(['laboratorium', 'anggota'] as Segmen[]).map((s) => {
            const aktif = s === segmen;
            return (
              <Pressable
                key={s}
                onPress={() => setSegmen(s)}
                accessibilityRole="tab"
                accessibilityState={{ selected: aktif }}
                style={[styles.item, aktif && styles.itemAktif]}
              >
                <Text style={[styles.itemText, aktif && { color: '#FFFFFF' }]}>
                  {s === 'laboratorium' ? 'Laboratorium' : 'Anggota & Impor'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {segmen === 'laboratorium' ? <LaboratoriumPanel embedded /> : <DistribusiPanel embedded />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 16, paddingBottom: 6, width: '100%', maxWidth: MAX_W, alignSelf: 'center' },
  segmen: { flexDirection: 'row', backgroundColor: W.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: W.line },
  item: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  itemAktif: { backgroundColor: W.blue },
  itemText: { fontSize: 14, fontWeight: '700', color: W.sub },
});
