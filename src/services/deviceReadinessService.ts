
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';

export type ReadinessResult = {
  ok: boolean;
  message?: string;
};

export async function checkDeviceReadiness(): Promise<ReadinessResult> {
  try {
    // 1. Periksa koneksi internet
    const network = await NetInfo.fetch();

    if (!network.isConnected || network.isInternetReachable === false) {
      return {
        ok: false,
        message: 'Koneksi internet bermasalah. Periksa jaringanmu, lalu coba kembali.',
      };
    }

    // 2. Periksa dan minta izin lokasi
    let permission = await Location.getForegroundPermissionsAsync();

    if (!permission.granted) {
      permission = await Location.requestForegroundPermissionsAsync();
    }

    if (!permission.granted) {
      return {
        ok: false,
        message: 'Izin lokasi ditolak. Aktifkan izin lokasi melalui pengaturan aplikasi untuk melakukan presensi.',
      };
    }

    // 3. Periksa apakah GPS aktif
    const servicesEnabled = await Location.hasServicesEnabledAsync();

    if (!servicesEnabled) {
      return {
        ok: false,
        message: 'GPS atau layanan lokasi sedang mati. Aktifkan lokasi perangkat, lalu coba kembali.',
      };
    }

    // 4. Pastikan lokasi berhasil diperoleh
    await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return { ok: true };
  } catch (error) {
    console.error('[FR-23] Pemeriksaan perangkat gagal:', error);

    return {
      ok: false,
      message: 'Lokasi belum tersedia. Pastikan GPS aktif dan coba kembali.',
    };
  }
}