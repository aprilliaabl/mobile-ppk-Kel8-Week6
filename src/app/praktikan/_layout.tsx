import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { BannerKondisiPerangkat } from '../../components/BannerKondisiPerangkat';
import { LoadingState } from '../../components/StateView';
import { ToastStatusSesi } from '../../components/ToastStatusSesi';
import { W } from '../../constants/warna';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentUser } from '../../hooks/use-current-user';

export default function PraktikanLayout() {
  const { currentUser, loading, activeRole } = useAuth();
  const praktikan = useCurrentUser('praktikan');

  if (loading) return <View style={{ flex: 1, backgroundColor: W.bg, justifyContent: 'center' }}><LoadingState /></View>;
  // Penjaga rute: hanya akun yang sedang memakai peran praktikan.
  if (!currentUser || activeRole !== 'praktikan') return <Redirect href="/" />;

  return (
    <View style={{ flex: 1, backgroundColor: W.bg }}>
      <BannerKondisiPerangkat periksaLokasi={true} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: W.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sesi/[id]" />
      </Stack>
      <ToastStatusSesi kelasList={praktikan.kelasList ?? []} />
    </View>
  );
}
