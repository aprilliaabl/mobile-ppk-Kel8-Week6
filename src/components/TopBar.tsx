import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ikon } from './Ikon';
import { W } from '../constants/warna';

/** Bilah atas dengan tombol back. Jika tidak ada riwayat navigasi (mis. dibuka langsung), kembali ke `fallback`. */
export function TopBar({ title, fallback, right }: { title: string; fallback: string; right?: React.ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kembali = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  };
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={kembali} style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel="Kembali" hitSlop={8}>
        <Ikon nama="kembali" size={20} color={W.text} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 12, backgroundColor: W.bg, borderBottomWidth: 1, borderBottomColor: W.line },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: W.card, borderWidth: 1, borderColor: W.line, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: W.text },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
