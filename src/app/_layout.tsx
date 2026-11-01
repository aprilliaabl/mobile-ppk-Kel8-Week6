import { Appearance } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { W } from '../constants/warna';

// Seluruh aplikasi memakai tema hitam yang sama.
if (typeof Appearance.setColorScheme === 'function') {
  Appearance.setColorScheme('dark');
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: W.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="asisten" />
        <Stack.Screen name="praktikan" />
      </Stack>
    </>
  );
}
