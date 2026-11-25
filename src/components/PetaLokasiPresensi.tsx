import React, { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Polyline, type Region } from 'react-native-maps';
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
 * Komponen Peta Lokasi & Geofence Radius Laboratorium (FR-18).
 * Mengimplementasikan konsep MapView, Marker, Circle, Polyline, dan Region
 * sesuai panduan "Implementing Google Maps and Routes Tracking in React Native" (Silversky Technology).
 */
export function PetaLokasiPresensi({
  laboratorium,
  koordinatPerangkat,
  jarakMeter,
  dalamRadius,
}: PetaLokasiPresensiProps) {
  const mapRef = useRef<MapView | null>(null);

  const initialRegion: Region | undefined = useMemo(() => {
    if (!laboratorium) return undefined;
    return {
      latitude: laboratorium.latitude,
      longitude: laboratorium.longitude,
      latitudeDelta: 0.0025,
      longitudeDelta: 0.0025,
    };
  }, [laboratorium]);

  if (!laboratorium || !initialRegion) {
    return (
      <View style={styles.fallbackBox}>
        <Ikon nama="lokasi" size={28} color={W.sub} />
        <Text style={styles.fallbackText}>
          Koordinat peta laboratorium belum tersedia untuk ruangan ini.
        </Text>
      </View>
    );
  }

  const fokusKeLab = () => {
    mapRef.current?.animateToRegion(
      {
        latitude: laboratorium.latitude,
        longitude: laboratorium.longitude,
        latitudeDelta: 0.0022,
        longitudeDelta: 0.0022,
      },
      350
    );
  };

  const fokusKePerangkat = () => {
    if (!koordinatPerangkat) return;
    mapRef.current?.animateToRegion(
      {
        latitude: koordinatPerangkat.latitude,
        longitude: koordinatPerangkat.longitude,
        latitudeDelta: 0.0022,
        longitudeDelta: 0.0022,
      },
      350
    );
  };

  const warnaRadius = dalamRadius ? '#10B981' : '#EF4444';
  const warnaIsiRadius = dalamRadius
    ? 'rgba(16, 185, 129, 0.22)'
    : 'rgba(239, 68, 68, 0.18)';

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          {/* Circle Geofence Radius Laboratorium */}
          <Circle
            center={{
              latitude: laboratorium.latitude,
              longitude: laboratorium.longitude,
            }}
            radius={laboratorium.radius}
            strokeWidth={2}
            strokeColor={warnaRadius}
            fillColor={warnaIsiRadius}
          />

          {/* Marker Titik Pusat Laboratorium */}
          <Marker
            coordinate={{
              latitude: laboratorium.latitude,
              longitude: laboratorium.longitude,
            }}
            title={laboratorium.nama}
            description={`Radius presensi: ${laboratorium.radius}m`}
            pinColor={W.blue}
          />

          {/* Marker Posisi Perangkat Praktikan & Polyline Rute ke Laboratorium */}
          {koordinatPerangkat && (
            <>
              <Marker
                coordinate={{
                  latitude: koordinatPerangkat.latitude,
                  longitude: koordinatPerangkat.longitude,
                }}
                title="Lokasi Perangkat Kamu"
                description={
                  jarakMeter !== null
                    ? `Jarak ke ${laboratorium.nama}: ${jarakMeter}m`
                    : 'Posisi GPS perangkat saat ini'
                }
                pinColor={dalamRadius ? W.green : W.red}
              />
              <Polyline
                coordinates={[
                  {
                    latitude: koordinatPerangkat.latitude,
                    longitude: koordinatPerangkat.longitude,
                  },
                  {
                    latitude: laboratorium.latitude,
                    longitude: laboratorium.longitude,
                  },
                ]}
                strokeColor={warnaRadius}
                strokeWidth={3}
                lineDashPattern={[6, 4]}
              />
            </>
          )}
        </MapView>

        {/* Kontrol Kamera Cepat (Tanpa memicu re-render state Region) */}
        <View style={styles.controls}>
          <Pressable
            onPress={fokusKeLab}
            style={styles.ctrlBtn}
            accessibilityRole="button"
          >
            <Ikon nama="lokasi" size={14} color={W.blue} />
            <Text style={styles.ctrlText}>Titik Lab</Text>
          </Pressable>
          {koordinatPerangkat && (
            <Pressable
              onPress={fokusKePerangkat}
              style={styles.ctrlBtn}
              accessibilityRole="button"
            >
              <Ikon
                nama="kompas"
                size={14}
                color={dalamRadius ? W.green : W.red}
              />
              <Text style={styles.ctrlText}>Posisi Saya</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: W.blue }]} />
          <Text style={styles.legendText}>
            {laboratorium.nama} ({laboratorium.latitude.toFixed(5)},{' '}
            {laboratorium.longitude.toFixed(5)})
          </Text>
        </View>
        {koordinatPerangkat && (
          <View style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: dalamRadius ? W.green : W.red },
              ]}
            />
            <Text style={styles.legendText}>
              Perangkat ({koordinatPerangkat.latitude.toFixed(5)},{' '}
              {koordinatPerangkat.longitude.toFixed(5)})
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  mapWrap: {
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: W.line,
    backgroundColor: W.bg,
  },
  map: { width: '100%', height: '100%' },
  controls: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  ctrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(18, 19, 22, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: W.line,
  },
  ctrlText: { color: W.text, fontSize: 11, fontWeight: '700' },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: W.sub },
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
