import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import {
  type KoordinatPerangkat,
  type StatusLokasiPerangkat,
} from '../constants/validasiPresensi';

export interface UseLokasiPresensiReturn {
  statusLokasi: StatusLokasiPerangkat;
  koordinat: KoordinatPerangkat | null;
  errorDetail: string | null;
  canAskAgain: boolean;
  segarkanLokasi: () => Promise<void>;
  bukaPengaturanIzin: () => Promise<void>;
  /** Mode simulasi GPS khusus pengujian di emulator/perangkat saat demonstrasi */
  setKoordinatSimulasi: (koord: KoordinatPerangkat | null) => void;
  isSimulasi: boolean;
}

/**
 * Custom hook untuk menangani permission lokasi Android, pengecekan layanan GPS,
 * dan pembacaan koordinat GPS perangkat untuk validasi presensi (FR-18).
 */
export function useLokasiPresensi(): UseLokasiPresensiReturn {
  const [statusLokasi, setStatusLokasi] =
    useState<StatusLokasiPerangkat>('memuat');
  const [koordinatAsli, setKoordinatAsli] =
    useState<KoordinatPerangkat | null>(null);
  const [koordinatSimulasi, setKoordinatSimulasiState] =
    useState<KoordinatPerangkat | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [canAskAgain, setCanAskAgain] = useState<boolean>(true);

  const ambilLokasi = useCallback(async () => {
    setStatusLokasi('memuat');
    setErrorDetail(null);

    try {
      // 1. Minta / periksa foreground permission
      const perm = await Location.requestForegroundPermissionsAsync();
      setCanAskAgain(perm.canAskAgain ?? true);

      if (perm.status !== 'granted') {
        setStatusLokasi('izin_ditolak');
        setKoordinatAsli(null);
        setErrorDetail('Permission lokasi belum diberikan.');
        return;
      }

      // 2. Periksa apakah GPS / layanan lokasi perangkat aktif
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setStatusLokasi('gps_mati');
        setKoordinatAsli(null);
        setErrorDetail(
          'Layanan lokasi (GPS) pada perangkat tidak aktif. Aktifkan GPS lalu coba lagi.'
        );
        return;
      }

      // 3. Ambil posisi saat ini dengan batas waktu 10 detik
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy:
            Platform.OS === 'web'
              ? Location.Accuracy.Balanced
              : Location.Accuracy.High,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'Waktu pembacaan GPS habis. Pastikan sinyal GPS terjangkau.'
                )
              ),
            10000
          )
        ),
      ]);

      const nextCoord: KoordinatPerangkat = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        mocked: Boolean(pos.mocked),
        timestamp: pos.timestamp,
      };

      setKoordinatAsli(nextCoord);
      setStatusLokasi('berhasil');
    } catch (err: unknown) {
      setKoordinatAsli(null);
      setStatusLokasi('gagal');
      setErrorDetail(
        err instanceof Error && err.message
          ? err.message
          : 'Lokasi perangkat tidak dapat diperoleh.'
      );
    }
  }, []);

  useEffect(() => {
    let aktif = true;
    (async () => {
      if (!aktif) return;
      await ambilLokasi();
    })();
    return () => {
      aktif = false;
    };
  }, [ambilLokasi]);

  const setKoordinatSimulasi = useCallback(
    (koord: KoordinatPerangkat | null) => {
      setKoordinatSimulasiState(koord);
      if (koord) {
        setStatusLokasi('berhasil');
        setErrorDetail(null);
      }
    },
    []
  );

  const bukaPengaturanIzin = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      // Abaikan jika platform tidak mendukung openSettings
    }
  }, []);

  const koordinat = koordinatSimulasi ?? koordinatAsli;
  const effectiveStatus: StatusLokasiPerangkat = koordinatSimulasi
    ? 'berhasil'
    : statusLokasi;

  return {
    statusLokasi: effectiveStatus,
    koordinat,
    errorDetail,
    canAskAgain,
    segarkanLokasi: ambilLokasi,
    bukaPengaturanIzin,
    setKoordinatSimulasi,
    isSimulasi: koordinatSimulasi !== null,
  };
}
