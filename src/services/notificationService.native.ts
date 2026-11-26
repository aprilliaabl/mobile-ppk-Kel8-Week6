import { PermissionsAndroid, Platform } from 'react-native';

import { getApp, getApps } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission,
  type RemoteMessage,
} from '@react-native-firebase/messaging';

import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

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

/**
 * Cek apakah app native Firebase ([DEFAULT]) sudah tersedia.
 * Di web / Expo Go / build tanpa google-services.json hasilnya false.
 */
function isNativeFirebaseReady(): boolean {
  if (Platform.OS === 'web') return false;

  try {
    return getApps().length > 0;
  } catch {
    return false;
  }
}

/**
 * Messaging dibuat LAZY (saat dipakai), bukan di level modul,
 * supaya tidak error "No Firebase App '[DEFAULT]' has been created"
 * ketika file ini di-import sebelum native siap.
 */
function getMsg() {
  return getMessaging(getApp());
}

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
    const status = await requestPermission(getMsg());

    // 1 = AUTHORIZED, 2 = PROVISIONAL
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

  const tokenRef = doc(db, COLLECTIONS.USERS, uid, 'fcmTokens', token);

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
export async function registerFCMToken(uid: string): Promise<{
  permissionGranted: boolean;
  unsubscribeToken: () => void;
}> {
  if (!isNativeFirebaseReady()) {
    console.warn(
      '[FCM] Firebase native belum siap (web / Expo Go / google-services.json belum ada).'
    );

    return {
      permissionGranted: false,
      unsubscribeToken: () => {},
    };
  }

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

  const token = await getToken(getMsg());
  await saveToken(uid, token);

  console.log('[FCM] Token berhasil didaftarkan.');

  const unsubscribeToken = onTokenRefresh(getMsg(), async (newToken) => {
    try {
      await saveToken(uid, newToken);
      console.log('[FCM] Token berhasil diperbarui.');
    } catch (error) {
      console.error('[FCM] Gagal menyimpan token baru:', error);
    }
  });

  return {
    permissionGranted: true,
    unsubscribeToken,
  };
}

/**
 * Listener pesan ketika aplikasi sedang foreground.
 */
export function listenForegroundMessages(): () => void {
  if (!isNativeFirebaseReady()) {
    return () => {};
  }

  try {
    return onMessage(getMsg(), async (message) => {
      console.log('[FCM] Pesan foreground diterima:', message.messageId);
      await showLocalNotification(message);
    });
  } catch (error) {
    console.warn('[FCM] Gagal memasang listener foreground:', error);
    return () => {};
  }
}

// CATATAN: setBackgroundMessageHandler sekarang ada di /index.js (root proyek),
// bukan di file ini.