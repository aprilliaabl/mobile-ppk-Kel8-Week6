import { Tabs } from 'expo-router/js-tabs';
import { Ikon } from '../../../components/Ikon';
import { W } from '../../../constants/warna';

/** Empat tab utama. Peta dibuka lewat pintasan di Beranda. */
export default function PraktikanTabs() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: W.blue,
        tabBarInactiveTintColor: W.sub,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: { backgroundColor: W.card, borderTopColor: W.line },
        sceneStyle: { backgroundColor: W.bg },
      }}
    >
      <Tabs.Screen name="beranda" options={{ title: 'Beranda', tabBarIcon: ({ color }) => <Ikon nama="dashboard" color={color} size={24} /> }} />
      <Tabs.Screen name="presensi" options={{ title: 'Presensi', tabBarIcon: ({ color }) => <Ikon nama="presensi" color={color} size={24} /> }} />
      <Tabs.Screen name="riwayat" options={{ title: 'Riwayat', tabBarIcon: ({ color }) => <Ikon nama="riwayat" color={color} size={24} /> }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun', tabBarIcon: ({ color }) => <Ikon nama="akun" color={color} size={24} /> }} />
      <Tabs.Screen name="peta" options={{ href: null }} />
    </Tabs>
  );
}
