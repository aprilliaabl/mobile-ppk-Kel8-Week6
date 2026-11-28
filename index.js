// Custom Expo entrypoint. Register FCM background handler on Android/iOS only.
// A native development build is required for React Native Firebase Messaging.
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  try {
    const messagingModule = require('@react-native-firebase/messaging');
    const appModule = require('@react-native-firebase/app');
    const apps = appModule.getApps?.() ?? [];
    if (apps.length > 0) {
      messagingModule.setBackgroundMessageHandler(
        messagingModule.getMessaging(appModule.getApp()),
        async (message) => {
          console.log('[FCM] Background message received:', message?.messageId ?? 'unknown');
        },
      );
    }
  } catch (error) {
    console.warn('[FCM] Background handler unavailable in this native binary:', error);
  }
}

require('expo-router/entry');
