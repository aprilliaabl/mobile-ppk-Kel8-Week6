import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { BannerKondisiPerangkat } from '../../components/BannerKondisiPerangkat';
import { LoadingState } from '../../components/StateView';
import { ToastStatusSesi } from '../../components/ToastStatusSesi';
import { W } from '../../constants/warna';
import { useAuth } from '../../contexts/AuthContext';

export default function AsistenLayout() {
  const { currentUser, loading, activeRole } = useAuth();

  if (loading) return <View style={{ flex: 1, backgroundColor: W.bg, justifyContent: 'center' }}><LoadingState /></View>;
  // Penjaga rute: hanya akun yang sedang memakai peran asisten.
  if (!currentUser || activeRole !== 'asisten') return <Redirect href="/" />;

  return (
    <View style={{ flex: 1, backgroundColor: W.bg }}>
      <BannerKondisiPerangkat />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: W.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sesi/[id]" />
      </Stack>
      <ToastStatusSesi />
    </View>
  );
}
