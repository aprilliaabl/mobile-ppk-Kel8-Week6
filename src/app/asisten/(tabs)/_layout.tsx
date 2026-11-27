import { Tabs } from 'expo-router/js-tabs';
import { Ikon } from '../../../components/Ikon';
import { W } from '../../../constants/warna';

export default function AsistenTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: W.blue,
        tabBarInactiveTintColor: W.sub,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: { backgroundColor: W.card, borderTopColor: W.line },
        sceneStyle: { backgroundColor: W.bg },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Beranda', tabBarIcon: ({ color }) => <Ikon nama="dashboard" color={color} size={22} /> }} />
      <Tabs.Screen name="beranda" options={{ title: 'Jadwal', tabBarIcon: ({ color }) => <Ikon nama="jadwal" color={color} size={22} /> }} />
      <Tabs.Screen name="laboratorium" options={{ title: 'Lab', tabBarIcon: ({ color }) => <Ikon nama="lab" color={color} size={22} /> }} />
      <Tabs.Screen name="distribusi" options={{ title: 'Anggota', tabBarIcon: ({ color }) => <Ikon nama="grup" color={color} size={22} /> }} />
      <Tabs.Screen name="peta" options={{ title: 'Peta', tabBarIcon: ({ color }) => <Ikon nama="peta" color={color} size={22} /> }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun', tabBarIcon: ({ color }) => <Ikon nama="akun" color={color} size={22} /> }} />
      {/* Riwayat sesi dibuka dari Beranda; tidak ditampilkan sebagai tab agar bilah tab tidak penuh. */}
      <Tabs.Screen name="riwayat" options={{ href: null }} />
    </Tabs>
  );
}
