import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { W } from '../constants/warna';

interface Props {
  badge: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

/** Kartu header bergaya Dashboard Asisten: lencana kecil, judul besar, dan ringkasan di bawahnya. */
export function HeaderCard({ badge, title, subtitle, right, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
        {right}
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

export function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: W.card, borderRadius: 24, padding: 20, gap: 6, borderWidth: 1, borderColor: W.line },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge: { backgroundColor: W.blueSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: W.blue, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  title: { fontSize: 26, fontWeight: '800', color: W.text },
  subtitle: { fontSize: 14, color: W.sub },
  stat: { flex: 1, backgroundColor: W.cardAlt, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12, gap: 2 },
  statLabel: { fontSize: 12, color: W.sub },
  statValue: { fontSize: 24, fontWeight: '800', color: W.text },
});
