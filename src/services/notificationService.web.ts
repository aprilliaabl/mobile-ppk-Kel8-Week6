import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerFCMToken(_uid: string): Promise<{
  permissionGranted: boolean;
  unsubscribeToken: () => void;
}> {
  // Web push is not configured in this project; avoid importing native modules on web.
  return { permissionGranted: false, unsubscribeToken: () => {} };
}

export function listenForegroundMessages(): () => void {
  return () => {};
}
