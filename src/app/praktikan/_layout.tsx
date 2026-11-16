import { Stack } from 'expo-router';
import { ToastStatusSesi } from '../../components/ToastStatusSesi';
import { userDummy } from '../../constants/dummy';
import { W } from '../../constants/warna';

export default function PraktikanLayout() {
  const praktikan = userDummy.find((u) => u.role === 'praktikan');
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: W.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sesi/[id]" />
      </Stack>
      <ToastStatusSesi kelas={praktikan?.kelas} />
    </>
  );
}
