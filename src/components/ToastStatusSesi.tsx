import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PerubahanSesi, usePerubahanSesi } from '../constants/sesiStore';
import { W } from '../constants/warna';

const native = Platform.OS !== 'web';

/**
 * FR-09: pemberitahuan singkat di bagian atas layar saat pengguna lain mengubah status sesi.
 * Isi `kelasList` untuk praktikan supaya hanya sesi kelasnya yang diberitahukan.
 */
export function ToastStatusSesi({ kelasList }: { kelasList?: string[] }) {
  const insets = useSafeAreaInsets();
  const perubahan = usePerubahanSesi();
  const [anim] = useState(() => new Animated.Value(0));
  const [tampil, setTampil] = useState<PerubahanSesi | null>(null);
  const [lastKey, setLastKey] = useState<number | undefined>(undefined);

  if (perubahan && perubahan.kunci !== lastKey) {
    setLastKey(perubahan.kunci);
    // Asisten (kelasList tidak diisi) menerima semua; praktikan hanya untuk kelas miliknya.
    const cocokKelas =
      kelasList === undefined ||
      kelasList.some((k) => k.trim().toUpperCase() === perubahan.sesi.kelas.trim().toUpperCase());
    if (cocokKelas) {
      setTampil(perubahan);
    }
  }

  useEffect(() => {
    if (!tampil) return;
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: native }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: native }).start(({ finished }) => {
        if (finished) setTampil(null);
      });
    }, 4500);
    return () => clearTimeout(timer);
  }, [tampil, anim]);

  const sembunyikan = () => {
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: native }).start(({ finished }) => {
      if (finished) setTampil(null);
    });
  };

  if (!tampil) return null;
  const dibuka = tampil.ke === 'dibuka';
  const warna = dibuka ? W.green : tampil.ke === 'ditutup' ? W.red : W.sub;
  const kataKerja = dibuka ? 'dibuka' : tampil.ke === 'ditutup' ? 'ditutup' : 'diubah';

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }]}>
      <Animated.View
        style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] }}
      >
        <Pressable onPress={sembunyikan} style={[styles.toast, { borderColor: warna }]} accessibilityRole="alert">
          <View style={[styles.dot, { backgroundColor: warna }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.judul, { color: warna }]}>Sesi telah {kataKerja}</Text>
            <Text style={styles.isi} numberOfLines={2}>{tampil.sesi.nama} • Kelas {tampil.sesi.kelas}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 50 },
  toast: { width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: W.card, borderRadius: 16, borderWidth: 1.5, padding: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  judul: { fontSize: 14, fontWeight: '800' },
  isi: { fontSize: 13, color: W.text, marginTop: 2 },
});
