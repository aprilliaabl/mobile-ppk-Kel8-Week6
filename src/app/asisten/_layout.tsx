import { Stack } from 'expo-router';

export default function AsistenLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="beranda" options={{ title: 'Jadwal Praktikum' }} />
      <Stack.Screen name="sesi/[id]" options={{ title: 'Detail Sesi' }} />
    </Stack>
  );
}