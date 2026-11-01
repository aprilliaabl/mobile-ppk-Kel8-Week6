import { View, Text, StyleSheet } from 'react-native';
import { StatusSesi } from '../constants/types';
import { W } from '../constants/warna';

export const LABEL_STATUS: Record<StatusSesi, string> = {
  belum_dibuka: 'Belum Dibuka',
  dibuka: 'Dibuka',
  ditutup: 'Ditutup',
};

export const WARNA_STATUS: Record<StatusSesi, { bg: string; fg: string }> = {
  belum_dibuka: { bg: W.graySoft, fg: W.gray },
  dibuka: { bg: W.greenSoft, fg: W.green },
  ditutup: { bg: W.redSoft, fg: W.red },
};

export function StatusBadge({ status }: { status: StatusSesi }) {
  const w = WARNA_STATUS[status];
  return (
    <View style={[styles.badge, { backgroundColor: w.bg }]}>
      <View style={[styles.dot, { backgroundColor: w.fg }]} />
      <Text style={[styles.text, { color: w.fg }]}>{LABEL_STATUS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: '700' },
});
