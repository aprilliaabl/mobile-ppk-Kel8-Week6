import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useLaboratoriumList } from '../constants/laboratoriumStore';
import { useSesiList } from '../constants/dummy';
import type { Laboratorium, Sesi } from '../constants/types';
import { W } from '../constants/warna';

// Import react-native-maps secara aman hanya untuk mobile native
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
let Callout: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Circle = Maps.Circle;
  Callout = Maps.Callout;
}

export function PetaLaboratoriumView() {
  const labList = useLaboratoriumList();
  const sesiList = useSesiList();

  const [lokasiUser, setLokasiUser] = useState<Location.LocationObjectCoords | null>(null);
  const [izinLokasi, setIzinLokasi] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [selectedLab, setSelectedLab] = useState<Laboratorium | null>(null);
  const [loadingLokasi, setLoadingLokasi] = useState(true);

  const mapRef = useRef<any>(null);

  // Koordinat Tengah Informatika FSM Undip
  const centerLat = selectedLab ? selectedLab.latitude : -7.047909;
  const centerLng = selectedLab ? selectedLab.longitude : 110.440866;

  const initialRegion = {
    latitude: -7.048000,
    longitude: 110.441000,
    latitudeDelta: 0.0025,
    longitudeDelta: 0.0025,
  };

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    async function inisialisasiLokasi() {
      try {
        setLoadingLokasi(true);
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setIzinLokasi('denied');
          setLoadingLokasi(false);
          return;
        }

        setIzinLokasi('granted');

        const lokasiAwal = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLokasiUser(lokasiAwal.coords);
        setLoadingLokasi(false);

        // Pantau realtime (FR-20)
        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 1, // update setiap 1 meter
            timeInterval: 2000,
          },
          (newLoc) => {
            setLokasiUser(newLoc.coords);
          }
        );
      } catch (err) {
        console.warn('[PetaLab] Gagal membaca lokasi:', err);
        setIzinLokasi('denied');
        setLoadingLokasi(false);
      }
    }

    inisialisasiLokasi();

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

  const fokusKeUser = () => {
    if (lokasiUser && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: lokasiUser.latitude,
          longitude: lokasiUser.longitude,
          latitudeDelta: 0.0015,
          longitudeDelta: 0.0015,
        },
        800
      );
    } else {
      Alert.alert('Lokasi Belum Tersedia', 'Pastikan izin lokasi diberikan dan GPS aktif.');
    }
  };

  // Aktivitas Sesi di Lab Terpilih (Sedang Berlangsung & Berikutnya)
  const getAktivitasLab = (lab: Laboratorium) => {
    const sesiDiLab = sesiList.filter(
      (s) =>
        s.laboratoriumId === lab.id ||
        s.ruang.toLowerCase().includes(lab.kode.toLowerCase()) ||
        s.ruang.toLowerCase().includes(lab.nama.toLowerCase())
    );

    const sedangBerlangsung = sesiDiLab.find((s) => s.status === 'dibuka');
    const berikutnya = sesiDiLab.find((s) => s.status === 'belum_dibuka');

    return { sedangBerlangsung, berikutnya, total: sesiDiLab.length };
  };

  // Generate HTML Leaflet Interaktif Khusus Web dengan Visualisasi Lingkaran Radius 10 Meter
  const renderWebLeafletMap = () => {
    const labsJson = JSON.stringify(labList);
    const userLat = lokasiUser ? lokasiUser.latitude : null;
    const userLng = lokasiUser ? lokasiUser.longitude : null;
    const activeLabId = selectedLab ? selectedLab.id : null;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html { margin:0; padding:0; height:100%; width:100%; background:#0F172A; }
          #map { height:100%; width:100%; }
          .custom-popup { font-family: system-ui, -apple-system, sans-serif; font-size: 12px; }
          .custom-popup b { color: #0284C7; font-size: 13px; }
          .radius-tag { display: inline-block; background: #DCFCE7; color: #15803D; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-top: 4px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${centerLat}, ${centerLng}], 19);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 21,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          const labs = ${labsJson};
          const activeLabId = ${activeLabId ? `"${activeLabId}"` : 'null'};

          labs.forEach(lab => {
            const rad = lab.radius || 10;
            const isSelected = activeLabId === lab.id;

            // 1. Marking Area Radius 10 Meter (Lingkaran)
            L.circle([lab.latitude, lab.longitude], {
              radius: rad,
              color: isSelected ? '#EF4444' : '#208AEF',
              fillColor: isSelected ? '#F87171' : '#38BDF8',
              fillOpacity: 0.35,
              weight: 2
            }).addTo(map);

            // 2. Marker Laboratorium
            const marker = L.marker([lab.latitude, lab.longitude]).addTo(map);
            marker.bindPopup(\`
              <div class="custom-popup">
                <b>\${lab.nama}</b><br/>
                \${lab.kode} • \${lab.gedung} (Lt. \${lab.lantai || 1})<br/>
                <span class="radius-tag">🎯 Area Presensi: \${rad} Meter</span>
              </div>
            \`);

            if (isSelected) {
              marker.openPopup();
            }
          });

          // Marker & Posisi User Saat Ini
          const userLat = ${userLat ?? 'null'};
          const userLng = ${userLng ?? 'null'};
          if (userLat && userLng) {
            L.circleMarker([userLat, userLng], {
              radius: 7,
              color: '#FFFFFF',
              fillColor: '#10B981',
              fillOpacity: 1,
              weight: 2
            }).addTo(map).bindPopup('<b>📍 Posisi Kamu Saat Ini</b>');
          }
        </script>
      </body>
      </html>
    `;

    return (
      <iframe
        title="Leaflet Map FSM Undip"
        srcDoc={htmlContent}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 16,
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        // ================= TAMPILAN PETA VISUAL WEB =================
        <View style={styles.webContainer}>
          {/* Header Info Web */}
          <View style={styles.webHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.webTitle}>🗺️ Peta Interaktif Laboratorium</Text>
              <Text style={styles.webSubtitle}>
                Gedung E & A FSM Undip • Marking Area Presensi Radius 10 Meter
              </Text>
            </View>
            <View style={styles.webGpsBadge}>
              <Text style={styles.webGpsText}>
                {izinLokasi === 'granted' ? '📍 GPS Aktif' : '⚠️ Perlu Izin GPS'}
              </Text>
            </View>
          </View>

          {/* Wrapper Peta Leaflet dengan Lingkaran Radius 10 Meter */}
          <View style={styles.mapFrameWrapper}>
            {renderWebLeafletMap()}

            {selectedLab && (
              <View style={styles.mapFloatingInfo}>
                <Text style={styles.mapFloatingTitle}>🎯 Target: {selectedLab.nama}</Text>
                <Text style={styles.mapFloatingSub}>
                  {selectedLab.latitude.toFixed(6)}, {selectedLab.longitude.toFixed(6)} • Radius {selectedLab.radius ?? 10}m
                </Text>
              </View>
            )}
          </View>

          {/* Daftar Kartu Pilihan Lab di Bawah Peta */}
          <Text style={styles.sectionTitle}>Pilih Marker Laboratorium:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.webLabList}
          >
            {labList.map((lab) => {
              const aktif = selectedLab?.id === lab.id;
              return (
                <Pressable
                  key={lab.id}
                  style={[styles.webLabCard, aktif && styles.webLabCardAktif]}
                  onPress={() => setSelectedLab(lab)}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.webLabNama, aktif && styles.webLabNamaAktif]}>
                      {lab.nama}
                    </Text>
                    <View style={styles.badgeRadiusSmall}>
                      <Text style={styles.badgeRadiusTextSmall}>{lab.radius ?? 10}m</Text>
                    </View>
                  </View>
                  <Text style={styles.webLabKode}>{lab.kode} • Lantai {lab.lantai ?? 1}</Text>
                  <Text style={styles.webLabGedung}>{lab.gedung}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        // ================= TAMPILAN MOBILE NATIVE GOOGLE MAPS =================
        <View style={StyleSheet.absoluteFill}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            showsCompass={true}
            showsBuildings={true}
          >
            {/* Visualisasi Marking Area Radius 10 Meter */}
            {labList.map((lab) => (
              <Circle
                key={`circle-${lab.id}`}
                center={{ latitude: lab.latitude, longitude: lab.longitude }}
                radius={lab.radius ?? 10}
                fillColor="rgba(32, 138, 239, 0.25)"
                strokeColor="#208AEF"
                strokeWidth={2}
              />
            ))}

            {/* Marker Laboratorium Informatika */}
            {labList.map((lab) => (
              <Marker
                key={`marker-${lab.id}`}
                coordinate={{ latitude: lab.latitude, longitude: lab.longitude }}
                title={lab.nama}
                description={`${lab.gedung} (Radius: ${lab.radius ?? 10}m)`}
                onPress={() => setSelectedLab(lab)}
                pinColor="#208AEF"
              />
            ))}

            {/* Live Real-time Marker Lokasi User */}
            {lokasiUser && (
              <Marker
                coordinate={{
                  latitude: lokasiUser.latitude,
                  longitude: lokasiUser.longitude,
                }}
                title="Posisi Kamu"
                description="Lokasi perangkat saat ini"
                pinColor="#10B981"
              />
            )}
          </MapView>

          {/* Tombol Melayang Fokus ke User */}
          <Pressable style={styles.myLocationBtn} onPress={fokusKeUser}>
            <Text style={styles.myLocationIcon}>📍</Text>
            <Text style={styles.myLocationText}>Lokasi Saya</Text>
          </Pressable>
        </View>
      )}

      {/* Modal / Bottom Sheet Detail Laboratorium Terpilih */}
      {selectedLab && (
        <View style={styles.bottomCard}>
          <View style={styles.bottomCardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{selectedLab.nama}</Text>
              <Text style={styles.cardSubtitle}>
                {selectedLab.kode} • {selectedLab.gedung} (Lt. {selectedLab.lantai ?? 1})
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={() => setSelectedLab(null)}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.badgeRadius}>
              <Text style={styles.badgeRadiusText}>
                🎯 Marking Area Presensi: {selectedLab.radius ?? 10} Meter
              </Text>
            </View>
            <View style={styles.badgeCoord}>
              <Text style={styles.badgeCoordText}>
                {selectedLab.latitude.toFixed(6)}, {selectedLab.longitude.toFixed(6)}
              </Text>
            </View>
          </View>

          {/* Info Praktikum yang Sedang Berlangsung & Berikutnya */}
          {(() => {
            const { sedangBerlangsung, berikutnya } = getAktivitasLab(selectedLab);
            return (
              <View style={styles.aktivitasBox}>
                <Text style={styles.aktivitasHeader}>Aktivitas Praktikum di Lab Ini:</Text>

                <View style={styles.sesiRow}>
                  <Text style={styles.sesiStatusLabel}>Sedang Berlangsung:</Text>
                  {sedangBerlangsung ? (
                    <Text style={styles.sesiAktifText}>
                      🟢 {sedangBerlangsung.nama} (Kelas {sedangBerlangsung.kelas})
                    </Text>
                  ) : (
                    <Text style={styles.sesiKosongText}>Tidak ada praktikum aktif saat ini</Text>
                  )}
                </View>

                <View style={styles.sesiRow}>
                  <Text style={styles.sesiStatusLabel}>Berikutnya:</Text>
                  {berikutnya ? (
                    <Text style={styles.sesiNextText}>
                      ⏳ {berikutnya.nama} (Kelas {berikutnya.kelas})
                    </Text>
                  ) : (
                    <Text style={styles.sesiKosongText}>Belum ada jadwal selanjutnya</Text>
                  )}
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: W.bg,
  },
  webContainer: {
    padding: 16,
    flex: 1,
    gap: 12,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: W.text,
  },
  webSubtitle: {
    fontSize: 12,
    color: W.sub,
    marginTop: 2,
  },
  webGpsBadge: {
    backgroundColor: W.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: W.line,
  },
  webGpsText: {
    color: W.green,
    fontSize: 12,
    fontWeight: '700',
  },
  mapFrameWrapper: {
    flex: 1,
    minHeight: 340,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: W.line,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  mapFloatingInfo: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: W.blue,
  },
  mapFloatingTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  mapFloatingSub: {
    color: W.sub,
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: W.text,
  },
  webLabList: {
    gap: 10,
    paddingBottom: 4,
  },
  webLabCard: {
    backgroundColor: W.card,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: W.line,
    width: 220,
    gap: 4,
  },
  webLabCardAktif: {
    borderColor: W.blue,
    backgroundColor: W.blueSoft,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webLabNama: {
    fontSize: 14,
    fontWeight: '800',
    color: W.text,
    flex: 1,
  },
  webLabNamaAktif: {
    color: W.blue,
  },
  badgeRadiusSmall: {
    backgroundColor: W.greenSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeRadiusTextSmall: {
    color: W.green,
    fontSize: 10,
    fontWeight: '800',
  },
  webLabKode: {
    fontSize: 12,
    color: W.blue,
    fontWeight: '700',
  },
  webLabGedung: {
    fontSize: 11,
    color: W.sub,
  },
  myLocationBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: W.card,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: W.line,
  },
  myLocationIcon: {
    fontSize: 16,
  },
  myLocationText: {
    color: W.text,
    fontSize: 13,
    fontWeight: '700',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: W.card,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: W.line,
  },
  bottomCardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: W.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: W.sub,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: W.cardAlt,
    borderRadius: 12,
  },
  closeBtnText: {
    color: W.sub,
    fontSize: 14,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  badgeRadius: {
    backgroundColor: W.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeRadiusText: {
    fontSize: 11,
    fontWeight: '800',
    color: W.green,
  },
  badgeCoord: {
    backgroundColor: W.cardAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeCoordText: {
    fontSize: 11,
    color: W.sub,
    fontWeight: '600',
  },
  aktivitasBox: {
    backgroundColor: W.cardAlt,
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginTop: 4,
  },
  aktivitasHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: W.text,
    marginBottom: 2,
  },
  sesiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sesiStatusLabel: {
    fontSize: 11,
    color: W.sub,
    fontWeight: '600',
  },
  sesiAktifText: {
    fontSize: 11,
    fontWeight: '800',
    color: W.green,
  },
  sesiNextText: {
    fontSize: 11,
    fontWeight: '700',
    color: W.blue,
  },
  sesiKosongText: {
    fontSize: 11,
    color: W.sub,
    fontStyle: 'italic',
  },
});
