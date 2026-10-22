import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      {/* Daftarkan halaman utama */}
      <Stack.Screen name="index" options={{ title: 'Pilih Role' }} />
      
      {/* Daftarkan grup folder asisten dan praktikan */}
      <Stack.Screen name="asisten" options={{ headerShown: false }} />
      <Stack.Screen name="praktikan" options={{ headerShown: false }} />
    </Stack>
  );
}