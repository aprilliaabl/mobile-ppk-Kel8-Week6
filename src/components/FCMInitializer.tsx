
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '../contexts/AuthContext';

import {
    listenForegroundMessages,
    registerFCMToken,
} from '../services/notificationService';

export default function FCMInitializer() {
  const { currentUser } = useAuth();

  // Listener pesan ketika aplikasi sedang terbuka.
  useEffect(() => {
    return listenForegroundMessages();
  }, []);

  // Registrasi token berdasarkan UID pengguna yang login.
  useEffect(() => {
    if (!currentUser?.uid) return;

    let isActive = true;
    let unsubscribeToken: (() => void) | undefined;

    const setupFCM = async () => {
      try {
        const result = await registerFCMToken(currentUser.uid);

        if (!isActive) {
          result.unsubscribeToken();
          return;
        }

        unsubscribeToken = result.unsubscribeToken;

        if (!result.permissionGranted) {
          Alert.alert(
            'Izin Notifikasi Belum Aktif',
            'Aktifkan izin notifikasi melalui pengaturan aplikasi agar kamu dapat menerima informasi pembukaan sesi, perubahan jadwal, dan keputusan pengajuan izin.',
            [{ text: 'Mengerti' }]
          );
        }
      } catch (error) {
        console.error('[FCM] Gagal melakukan registrasi:', error);

        if (isActive) {
          Alert.alert(
            'Notifikasi Belum Tersedia',
            'Registrasi notifikasi gagal. Periksa koneksi internet dan coba kembali.',
            [{ text: 'Mengerti' }]
          );
        }
      }
    };

    void setupFCM();

    return () => {
      isActive = false;
      unsubscribeToken?.();
    };
  }, [currentUser?.uid]);

  return null;
}