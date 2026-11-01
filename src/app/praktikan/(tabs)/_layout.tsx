import { Tabs } from 'expo-router/js-tabs';
import { Ikon } from '../../../components/Ikon';
import { W } from '../../../constants/warna';

export default function PraktikanTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: W.blue,
        tabBarInactiveTintColor: W.sub,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: { backgroundColor: W.card, borderTopColor: W.line },
        sceneStyle: { backgroundColor: W.bg },
      }}
    >
      <Tabs.Screen name="beranda" options={{ title: 'Jadwal', tabBarIcon: ({ color }) => <Ikon nama="jadwal" color={color} size={24} /> }} />
      <Tabs.Screen name="riwayat" options={{ title: 'Riwayat', tabBarIcon: ({ color }) => <Ikon nama="riwayat" color={color} size={24} /> }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun', tabBarIcon: ({ color }) => <Ikon nama="akun" color={color} size={24} /> }} />
    </Tabs>
  );
}
