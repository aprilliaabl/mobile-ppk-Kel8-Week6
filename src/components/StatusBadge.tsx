import { View, Text, StyleSheet } from 'react-native';
import { StatusSesi } from '../constants/types';

const LABEL: Record<StatusSesi, string> = {
  belum_dibuka: 'Belum Dibuka',
  dibuka: 'Dibuka',
  ditutup: 'Ditutup',
};

const WARNA: Record<StatusSesi, { bg: string; text: string }> = {
  belum_dibuka: { bg: '#E5E7EB', text: '#4B5563' },
  dibuka: { bg: '#D1FAE5', text: '#065F46' },
  ditutup: { bg: '#FEE2E2', text: '#991B1B' },
};

export function StatusBadge({ status }: { status: StatusSesi }) {
  const w = WARNA[status];
  return (
    <View style={[styles.badge, { backgroundColor: w.bg }]}>
      <Text style={[styles.text, { color: w.text }]}>{LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  text: { fontSize: 12, fontWeight: '600' },
});