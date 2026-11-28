import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { W } from '../constants/warna';
import { izinNotifikasiAktif } from '../services/notificationService';

interface Kondisi {
  offline: boolean;
  notifikasiMati: boolean;
  lokasiDitolak: boolean;
  gpsMati: boolean;
}

/**
 * FR-23: banner yang menjelaskan kondisi perangkat yang menghambat fitur —
 * offline, izin notifikasi ditolak, izin lokasi ditolak, atau GPS mati.
 */
export function BannerKondisiPerangkat({ periksaLokasi = true }: { periksaLokasi?: boolean }) {
  const [k, setK] = useState<Kondisi>({ offline: false, notifikasiMati: false, lokasiDitolak: false, gpsMati: false });

  const periksa = useCallback(async () => {
    try {
      const [net, notif, izinLokasi, gps] = await Promise.all([
        NetInfo.fetch(),
        izinNotifikasiAktif(),
        Location.getForegroundPermissionsAsync(),
        Location.hasServicesEnabledAsync().catch(() => true),
      ]);
      setK({
        offline: !net.isConnected || net.isInternetReachable === false,
        notifikasiMati: !notif,
        lokasiDitolak: periksaLokasi && !izinLokasi.granted,
        gpsMati: periksaLokasi && izinLokasi.granted && !gps,
      });
    } catch {
      // Pemeriksaan kondisi tidak boleh mengganggu aplikasi.
    }
  }, [periksaLokasi]);

  useEffect(() => {
    void periksa();
    const unsubNet = NetInfo.addEventListener((s) =>
      setK((p) => ({ ...p, offline: !s.isConnected || s.isInternetReachable === false }))
    );
    // Periksa ulang setelah pengguna kembali dari pengaturan.
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void periksa();
    });
    return () => {
      unsubNet();
      sub.remove();
    };
  }, [periksa]);

  const pesan: { teks: string; aksi?: boolean }[] = [];
  if (k.offline) pesan.push({ teks: 'Tidak ada koneksi internet. Data terakhir ditampilkan dan presensi tidak dapat dikirim.' });
  if (k.lokasiDitolak) pesan.push({ teks: 'Izin lokasi ditolak. Presensi dan peta posisi memerlukan izin lokasi.', aksi: true });
  if (k.gpsMati) pesan.push({ teks: 'GPS perangkat mati. Aktifkan layanan lokasi untuk presensi.', aksi: true });
  if (k.notifikasiMati) pesan.push({ teks: 'Notifikasi tidak aktif. Kamu tidak akan menerima info sesi dibuka, jadwal berubah, atau keputusan izin.', aksi: true });
  if (pesan.length === 0) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      {pesan.map((p) => (
        <View key={p.teks} style={styles.baris}>
          <Text style={styles.teks}>{p.teks}</Text>
          {p.aksi && (
            <Pressable onPress={() => Linking.openSettings().catch(() => {})} accessibilityRole="button">
              <Text style={styles.link}>Buka pengaturan</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderBottomWidth: 1, borderBottomColor: W.amber, paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  teks: { flex: 1, fontSize: 12, color: W.amber, fontWeight: '600', lineHeight: 17, minWidth: 200 },
  link: { fontSize: 12, color: W.text, fontWeight: '800', textDecorationLine: 'underline' },
});
