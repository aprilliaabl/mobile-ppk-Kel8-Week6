import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Laboratorium } from '../constants/types';
import type { KoordinatPerangkat } from '../constants/validasiPresensi';
import { W } from '../constants/warna';
import { Ikon } from './Ikon';

export interface PetaLokasiPresensiProps {
  laboratorium: Laboratorium | undefined;
  koordinatPerangkat: KoordinatPerangkat | null;
  jarakMeter: number | null;
  dalamRadius: boolean;
}

/**
 * Fallback Web untuk PetaLokasiPresensi (karena react-native-maps hanya untuk Native Android/iOS).
 * Menampilkan visualisasi radar radius laboratorium, titik koordinat perangkat, dan jarak rute.
 */
export function PetaLokasiPresensi({
  laboratorium,
  koordinatPerangkat,
  jarakMeter,
  dalamRadius,
}: PetaLokasiPresensiProps) {
  if (!laboratorium) {
    return (
      <View style={styles.fallbackBox}>
        <Ikon nama="lokasi" size={28} color={W.sub} />
        <Text style={styles.fallbackText}>
          Koordinat peta laboratorium belum tersedia untuk ruangan ini.
        </Text>
      </View>
    );
  }

  const warna = dalamRadius ? W.green : W.red;
  const bgSoft = dalamRadius ? W.greenSoft : W.redSoft;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.radarBox,
          koordinatPerangkat && { borderColor: warna, backgroundColor: bgSoft },
        ]}
      >
        <View style={styles.radarHeader}>
          <Ikon nama="lokasi" size={20} color={W.blue} />
          <Text style={styles.radarTitle}>
            Geofence {laboratorium.nama} (Radius {laboratorium.radius}m)
          </Text>
        </View>
        <Text style={styles.coordText}>
          Titik Lab: {laboratorium.latitude.toFixed(5)},{' '}
          {laboratorium.longitude.toFixed(5)}
        </Text>
        {koordinatPerangkat ? (
          <>
            <Text style={styles.coordText}>
              Posisi Perangkat: {koordinatPerangkat.latitude.toFixed(5)},{' '}
              {koordinatPerangkat.longitude.toFixed(5)}
            </Text>
            {jarakMeter !== null && (
              <Text style={[styles.distText, { color: warna }]}>
                Jarak ke Laboratorium: {jarakMeter} meter (
                {dalamRadius ? 'DALAM RADIUS' : 'DI LUAR RADIUS'})
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.coordText}>
            Menunggu pembacaan koordinat GPS perangkat...
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  radarBox: {
    backgroundColor: W.bg,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: W.line,
  },
  radarHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radarTitle: { fontSize: 14, fontWeight: '800', color: W.text },
  coordText: { fontSize: 12, color: W.sub },
  distText: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  fallbackBox: {
    backgroundColor: W.bg,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: W.line,
  },
  fallbackText: { fontSize: 12, color: W.sub, textAlign: 'center' },
});
