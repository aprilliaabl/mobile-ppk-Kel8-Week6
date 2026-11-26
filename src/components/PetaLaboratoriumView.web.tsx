import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import * as Location from 'expo-location';
import { useLaboratoriumList } from '../constants/laboratoriumStore';
import { useSesiList } from '../constants/dummy';
import type { Laboratorium } from '../constants/types';

export function PetaLaboratoriumView() {
  const labs = useLaboratoriumList();
  const sessions = useSesiList();
  const [position, setPosition] = useState<Location.LocationObjectCoords | null>(null);
  const [selected, setSelected] = useState<Laboratorium | null>(null);
  const [message, setMessage] = useState('Lokasi pengguna belum tersedia.');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await Location.requestForegroundPermissionsAsync();
        if (!p.granted) { if (!cancelled) setMessage('Izin lokasi ditolak.'); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) { setPosition(loc.coords); setMessage(''); }
      } catch { if (!cancelled) setMessage('Lokasi tidak tersedia pada browser ini.'); }
    })();
    return () => { cancelled = true; };
  }, []);
  const openMap = (lab: Laboratorium) => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lab.latitude},${lab.longitude}`);
  return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Peta Laboratorium</Text>
    <Text style={styles.notice}>{message || (position ? `Posisi Anda: ${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : '')}</Text>
    <Text style={styles.note}>Peta interaktif Web belum menggunakan embed Google Maps. Gunakan tombol untuk membuka titik laboratorium di Google Maps.</Text>
    {labs.map((lab) => {
      const activity = sessions.filter((s) => s.laboratoriumId === lab.id || s.ruang?.toLowerCase().includes(lab.kode.toLowerCase()));
      return <View key={lab.id} style={styles.card}>
        <Pressable onPress={() => setSelected(selected?.id === lab.id ? null : lab)}><Text style={styles.lab}>{lab.nama}</Text><Text>{lab.gedung} · Radius {lab.radius} m</Text><Text style={styles.blue}>Koordinat: {lab.latitude}, {lab.longitude}</Text></Pressable>
        <Pressable style={styles.button} onPress={() => openMap(lab)}><Text style={styles.buttonText}>Buka di Google Maps</Text></Pressable>
        {selected?.id === lab.id && <View><Text style={styles.desc}>{lab.deskripsi}</Text>{activity.length ? activity.map((s) => <Text key={s.id} style={styles.desc}>{s.nama} · {s.kelas} · {s.waktuMulai}–{s.waktuSelesai} · {s.status}</Text>) : <Text style={styles.desc}>Belum ada aktivitas sesi terkait.</Text>}</View>}
      </View>;
    })}
  </ScrollView>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, content: { padding: 16, gap: 12 }, title: { fontSize: 22, fontWeight: '700' }, notice: { color: '#555' }, note: { padding: 12, backgroundColor: '#fff4d6', borderRadius: 8 }, card: { padding: 14, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ddd', gap: 8 }, lab: { fontSize: 17, fontWeight: '700' }, blue: { color: '#208AEF' }, button: { backgroundColor: '#208AEF', padding: 12, borderRadius: 8 }, buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' }, desc: { marginTop: 8, color: '#444' } });
