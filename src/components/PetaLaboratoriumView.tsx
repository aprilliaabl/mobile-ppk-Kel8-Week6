import React, { useEffect, useState } from 'react';
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
import { WebView } from 'react-native-webview';
import { useLaboratoriumList } from '../constants/laboratoriumStore';
import { useSesiList } from '../constants/dummy';
import type { Laboratorium } from '../constants/types';
import { W } from '../constants/warna';

export function PetaLaboratoriumView() {
  const labList = useLaboratoriumList();
  const sesiList = useSesiList();

  const [lokasiUser, setLokasiUser] = useState<Location.LocationObjectCoords | null>(null);
  const [izinLokasi, setIzinLokasi] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [selectedLab, setSelectedLab] = useState<Laboratorium | null>(null);

  // Koordinat Pusat (Default FSM Undip Gedung E & A)
  const centerLat = selectedLab ? selectedLab.latitude : -7.047909;
  const centerLng = selectedLab ? selectedLab.longitude : 110.440866;

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    async function inisialisasiLokasi() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setIzinLokasi('denied');
          return;
        }

        setIzinLokasi('granted');

        const lokasiAwal = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLokasiUser(lokasiAwal.coords);

        // Pantau pergerakan lokasi pengguna secara realtime (FR-20)
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
      }
    }

    inisialisasiLokasi();

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

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

  // Template HTML Leaflet Interaktif (Kompatibel 100% Android WebView & Browser Web)
  const renderLeafletHTML = () => {
    const labsJson = JSON.stringify(labList);
    const userLat = lokasiUser ? lokasiUser.latitude : null;
    const userLng = lokasiUser ? lokasiUser.longitude : null;
    const activeLabId = selectedLab ? selectedLab.id : null;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html { margin:0; padding:0; height:100%; width:100%; background:#0F172A; }
          #map { height:100%; width:100%; }
          .custom-popup { font-family: system-ui, -apple-system, sans-serif; font-size: 13px; line-height: 1.4; }
          .custom-popup b { color: #0284C7; font-size: 14px; }
          .radius-tag { display: inline-block; background: #DCFCE7; color: #15803D; padding: 2px 7px; border-radius: 4px; font-weight: 700; margin-top: 5px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 19);
          L.control.zoom({ position: 'topright' }).addTo(map);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 21,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          const labs = ${labsJson};
          const activeLabId = ${activeLabId ? `"${activeLabId}"` : 'null'};

          labs.forEach(lab => {
            const rad = lab.radius || 10;
            const isSelected = activeLabId === lab.id;

            // 1. Marking Area Radius 10 Meter (Geofence Circle)
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

          // Marker Live Posisi Pengguna
          const userLat = ${userLat ?? 'null'};
          const userLng = ${userLng ?? 'null'};
          if (userLat && userLng) {
            L.circleMarker([userLat, userLng], {
              radius: 8,
              color: '#FFFFFF',
              fillColor: '#10B981',
              fillOpacity: 1,
              weight: 3
            }).addTo(map).bindPopup('<b>📍 Posisi Kamu Saat Ini</b>');
          }
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      {/* Header Info Atas */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🗺️ Peta Interaktif Laboratorium</Text>
          <Text style={styles.subtitle}>
            FSM Undip • Radius Presensi 10 Meter
          </Text>
        </View>
        <View style={styles.gpsBadge}>
          <Text style={styles.gpsText}>
            {izinLokasi === 'granted' ? '📍 GPS Aktif' : '⚠️ Cek Izin GPS'}
          </Text>
        </View>
      </View>

      {/* Frame Tampilan Peta Interaktif (Bebas Google Maps API Key) */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          // @ts-ignore - iframe untuk browser Web
          <iframe
            title="Peta Laboratorium"
            srcDoc={renderLeafletHTML()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 16,
            }}
          />
        ) : (
          // WebView untuk Android & iOS Native APK
          <WebView
            originWhitelist={['*']}
            source={{ html: renderLeafletHTML() }}
            style={{ flex: 1, borderRadius: 16, backgroundColor: '#0F172A' }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />
        )}

        {selectedLab && (
          <View style={styles.floatingTarget}>
            <Text style={styles.floatingTitle}>🎯 Target: {selectedLab.nama}</Text>
            <Text style={styles.floatingSub}>
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
        contentContainerStyle={styles.labListScroll}
      >
        {labList.map((lab) => {
          const aktif = selectedLab?.id === lab.id;
          return (
            <Pressable
              key={lab.id}
              style={[styles.labCard, aktif && styles.labCardAktif]}
              onPress={() => setSelectedLab(lab)}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.labNama, aktif && styles.labNamaAktif]}>
                  {lab.nama}
                </Text>
                <View style={styles.badgeRadiusSmall}>
                  <Text style={styles.badgeRadiusTextSmall}>{lab.radius ?? 10}m</Text>
                </View>
              </View>
              <Text style={styles.labKode}>{lab.kode} • Lantai {lab.lantai ?? 1}</Text>
              <Text style={styles.labGedung}>{lab.gedung}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Bottom Card Detail Laboratorium Terpilih & Aktivitas Sesi */}
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
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'android' ? 24 : 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: W.text,
  },
  subtitle: {
    fontSize: 12,
    color: W.sub,
    marginTop: 2,
  },
  gpsBadge: {
    backgroundColor: W.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: W.line,
  },
  gpsText: {
    color: W.green,
    fontSize: 12,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    minHeight: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: W.line,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  floatingTarget: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: W.blue,
  },
  floatingTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  floatingSub: {
    color: W.sub,
    fontSize: 10,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: W.text,
  },
  labListScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  labCard: {
    backgroundColor: W.card,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: W.line,
    width: 220,
    gap: 4,
  },
  labCardAktif: {
    borderColor: W.blue,
    backgroundColor: W.blueSoft,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labNama: {
    fontSize: 14,
    fontWeight: '800',
    color: W.text,
    flex: 1,
  },
  labNamaAktif: {
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
  labKode: {
    fontSize: 12,
    color: W.blue,
    fontWeight: '700',
  },
  labGedung: {
    fontSize: 11,
    color: W.sub,
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
