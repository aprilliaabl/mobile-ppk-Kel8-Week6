import * as Location from 'expo-location';

export type ReadinessResult = { ok: boolean; message?: string };

export async function checkDeviceReadiness(): Promise<ReadinessResult> {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { ok: false, message: 'Koneksi internet bermasalah. Periksa jaringanmu, lalu coba kembali.' };
    }
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      const requested = await Location.requestForegroundPermissionsAsync();
      if (!requested.granted) {
        return { ok: false, message: 'Izin lokasi ditolak. Aktifkan izin lokasi untuk melakukan presensi.' };
      }
    }
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return { ok: false, message: 'Layanan lokasi sedang mati.' };
    await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { ok: true };
  } catch {
    return { ok: false, message: 'Lokasi belum tersedia. Periksa izin lokasi dan coba kembali.' };
  }
}
