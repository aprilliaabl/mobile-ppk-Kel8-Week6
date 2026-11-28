
import { useEffect } from 'react';

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

        // Izin yang ditolak ditampilkan oleh BannerKondisiPerangkat (FR-23), bukan lewat dialog setiap login.
      } catch (error) {
        console.error('[FCM] Gagal melakukan registrasi:', error);

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