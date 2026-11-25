
import { PermissionsAndroid, Platform } from 'react-native';

import {
    getMessaging,
    getToken,
    onMessage,
    onTokenRefresh,
    setBackgroundMessageHandler,
    type RemoteMessage,
} from '@react-native-firebase/messaging';

import {
    doc,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';

import * as Notifications from 'expo-notifications';

import { COLLECTIONS, db } from '../config/firebase';

// Pengaturan tampilan notifikasi saat aplikasi foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Instance Firebase Messaging native.
const messaging = getMessaging();

/**
 * Menampilkan notifikasi lokal ketika pesan FCM diterima
 * saat aplikasi sedang terbuka.
 */
async function showLocalNotification(message: RemoteMessage) {
  const title =
    message.notification?.title ??
    (typeof message.data?.title === 'string'
      ? message.data.title
      : 'Notifikasi PPK');

  const body =
    message.notification?.body ??
    (typeof message.data?.body === 'string'
      ? message.data.body
      : 'Ada informasi terbaru untuk Anda.');

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: message.data ?? {},
    },
    trigger: null,
  });
}

/**
 * Meminta izin notifikasi sesuai platform.
 */
async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Number(Platform.Version) >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      return result === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  }

  if (Platform.OS === 'ios') {
    const status = await messaging.requestPermission();

    return status === 1 || status === 2;
  }

  return false;
}

/**
 * Menyimpan token FCM ke:
 * users/{uid}/fcmTokens/{token}
 */
async function saveToken(uid: string, token: string) {
  if (!db) {
    throw new Error('Firestore belum terinisialisasi.');
  }

  const tokenRef = doc(
    db,
    COLLECTIONS.USERS,
    uid,
    'fcmTokens',
    token
  );

  await setDoc(tokenRef, {
    token,
    platform: Platform.OS,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Meminta izin, mengambil token, menyimpan token,
 * dan mendengarkan perubahan token.
 */
export async function registerFCMToken(
  uid: string
): Promise<{
  permissionGranted: boolean;
  unsubscribeToken: () => void;
}> {
  const permissionGranted = await requestNotificationPermission();

  if (!permissionGranted) {
    console.warn('[FCM] Izin notifikasi tidak diberikan.');

    return {
      permissionGranted: false,
      unsubscribeToken: () => {},
    };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifikasi PPK',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = await getToken(messaging);
  await saveToken(uid, token);

  console.log('[FCM] Token berhasil didaftarkan.');

  const unsubscribeToken = onTokenRefresh(
    messaging,
    async (newToken) => {
      try {
        await saveToken(uid, newToken);
        console.log('[FCM] Token berhasil diperbarui.');
      } catch (error) {
        console.error('[FCM] Gagal menyimpan token baru:', error);
      }
    }
  );

  return {
    permissionGranted: true,
    unsubscribeToken,
  };
}

/**
 * Listener pesan ketika aplikasi sedang foreground.
 */
export function listenForegroundMessages() {
  return onMessage(messaging, async (message) => {
    console.log('[FCM] Pesan foreground diterima:', message.messageId);
    await showLocalNotification(message);
  });
}

/**
 * Handler pesan ketika aplikasi berjalan di background.
 * Harus didaftarkan pada scope modul, bukan di dalam komponen.
 */
setBackgroundMessageHandler(messaging, async (message) => {
  console.log('[FCM] Pesan background diterima:', message.messageId);
});