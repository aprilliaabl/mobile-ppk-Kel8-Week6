
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Appearance } from 'react-native';
import { W } from '../constants/warna';
import { AuthProvider } from '../contexts/AuthContext';

// Seluruh aplikasi memakai tema hitam yang sama.
if (typeof Appearance.setColorScheme === 'function') {
  Appearance.setColorScheme('dark');
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: W.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="asisten" />
        <Stack.Screen name="praktikan" />
      </Stack>
    </AuthProvider>
  );
}