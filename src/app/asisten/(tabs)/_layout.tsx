import { Tabs } from 'expo-router/js-tabs';
import { Ikon } from '../../../components/Ikon';
import { W } from '../../../constants/warna';

/** Empat tab utama. Peta, Riwayat, dan Anggota tetap dapat dibuka lewat pintasan di Beranda atau tab Kelola. */
export default function AsistenTabs() {
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
      <Tabs.Screen name="dashboard" options={{ title: 'Beranda', tabBarIcon: ({ color }) => <Ikon nama="dashboard" color={color} size={24} /> }} />
      <Tabs.Screen name="beranda" options={{ title: 'Jadwal', tabBarIcon: ({ color }) => <Ikon nama="jadwal" color={color} size={24} /> }} />
      <Tabs.Screen name="kelola" options={{ title: 'Kelola', tabBarIcon: ({ color }) => <Ikon nama="lab" color={color} size={24} /> }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun', tabBarIcon: ({ color }) => <Ikon nama="akun" color={color} size={24} /> }} />
      <Tabs.Screen name="laboratorium" options={{ href: null }} />
      <Tabs.Screen name="distribusi" options={{ href: null }} />
      <Tabs.Screen name="peta" options={{ href: null }} />
      <Tabs.Screen name="riwayat" options={{ href: null }} />
    </Tabs>
  );
}
