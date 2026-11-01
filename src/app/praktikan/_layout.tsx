import { Stack } from 'expo-router';
import { W } from '../../constants/warna';

export default function PraktikanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: W.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sesi/[id]" />
    </Stack>
  );
}
