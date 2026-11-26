import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLaboratoriumList } from '../constants/laboratoriumStore';
import { useSesiList } from '../constants/dummy';
import type { Laboratorium } from '../constants/types';
import { W } from '../constants/warna';

export function PetaLaboratoriumView() {
  const labs = useLaboratoriumList();
  const sesi = useSesiList();
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [selected, setSelected] = useState<Laboratorium | null>(null);
  const [permissionMessage, setPermissionMessage] = useState('Meminta izin lokasi…');

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      try {
        const p = await Location.requestForegroundPermissionsAsync();
        if (!p.granted) { setPermissionMessage('Izin lokasi ditolak. Marker laboratorium tetap dapat dipilih.'); return; }
        if (!(await Location.hasServicesEnabledAsync())) { setPermissionMessage('Layanan lokasi mati.'); return; }
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) { setCoords(current.coords); setPermissionMessage(''); }
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 5 }, (loc) => {
          if (!cancelled) setCoords(loc.coords);
        });
      } catch { if (!cancelled) setPermissionMessage('Lokasi belum tersedia.'); }
    })();
    return () => { cancelled = true; sub?.remove(); };
  }, []);

  const initial = selected ?? labs[0];
  const activities = selected ? sesi.filter((s) => s.laboratoriumId === selected.id || s.ruang?.toLowerCase().includes(selected.kode.toLowerCase())) : [];
  return (
    <View style={styles.root}>
      {permissionMessage ? <Text style={styles.notice}>{permissionMessage}</Text> : null}
      {labs.length === 0 ? <ActivityIndicator /> : (
        <MapView style={styles.map} initialRegion={{ latitude: initial?.latitude ?? -7.047909, longitude: initial?.longitude ?? 110.440866, latitudeDelta: 0.006, longitudeDelta: 0.006 }} showsUserLocation={!!coords}>
          {labs.map((lab) => <React.Fragment key={lab.id}>
            <Marker coordinate={{ latitude: lab.latitude, longitude: lab.longitude }} title={lab.nama} description={lab.deskripsi} onPress={() => setSelected(lab)} />
            <Circle center={{ latitude: lab.latitude, longitude: lab.longitude }} radius={lab.radius} strokeColor="#208AEF" fillColor="rgba(32,138,239,0.12)" />
          </React.Fragment>)}
        </MapView>
      )}
      <View style={styles.panel}>
        <Text style={styles.heading}>{selected?.nama ?? 'Laboratorium Informatika'}</Text>
        <Text style={styles.sub}>{selected?.deskripsi ?? 'Pilih marker laboratorium pada peta.'}</Text>
        {selected ? <Text style={styles.sub}>Radius presensi: {selected.radius} meter</Text> : null}
        {selected && activities.length ? activities.map((s) => <Text key={s.id} style={styles.activity}>{s.nama} · {s.kelas} · {s.waktuMulai}–{s.waktuSelesai} · {s.status}</Text>) : selected ? <Text style={styles.sub}>Belum ada aktivitas sesi terkait.</Text> : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: W.bg }, map: { flex: 1, minHeight: 300 }, notice: { padding: 12, color: W.text }, panel: { padding: 14, backgroundColor: W.card ?? W.bg }, heading: { color: W.text, fontSize: 17, fontWeight: '700' }, sub: { color: W.text, marginTop: 6 }, activity: { color: W.text, marginTop: 8, fontWeight: '600' } });
