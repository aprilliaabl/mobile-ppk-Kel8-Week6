import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
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

/** JSON aman untuk disisipkan ke dalam <script> (mencegah "</script>" dari nama lab menutup skrip). */
const aman = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

/**
 * Peta lokasi & radius presensi (FR-18) memakai Leaflet + OpenStreetMap di dalam WebView,
 * sama seperti tab Peta, sehingga tidak memerlukan API key Google.
 * HTML hanya dibuat ulang saat data laboratorium berubah. Posisi perangkat dikirim lewat
 * injectJavaScript supaya peta tidak dimuat ulang setiap GPS bergerak.
 */
export function PetaLokasiPresensi({ laboratorium, koordinatPerangkat, jarakMeter, dalamRadius }: PetaLokasiPresensiProps) {
  const webRef = useRef<WebView | null>(null);
  const [siap, setSiap] = useState(false);
  const [gagal, setGagal] = useState(false);

  const lab = laboratorium;
  const html = useMemo(() => {
    if (!lab) return '';
    const data = aman({ lat: lab.latitude, lng: lab.longitude, radius: lab.radius, nama: lab.nama });
    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#121316; }
  .leaflet-container { font-family: system-ui, -apple-system, sans-serif; }
</style>
</head><body><div id="map"></div>
<script>
  function kirim(p) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(p); }
  if (typeof L === 'undefined') { kirim('gagal'); }
  else {
    var D = ${data};
    var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([D.lat, D.lng], 18);
    L.control.zoom({ position: 'topright' }).addTo(map);
    var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, attribution: '&copy; OpenStreetMap' }).addTo(map);
    var gagalTile = 0;
    tiles.on('tileerror', function () { gagalTile++; if (gagalTile === 4) kirim('gagal'); });
    tiles.on('tileload', function () { kirim('ok'); });

    function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
    var HIJAU = '#10B981', MERAH = '#EF4444', BIRU = '#208AEF';
    var lingkaran = L.circle([D.lat, D.lng], { radius: D.radius, color: MERAH, fillColor: MERAH, fillOpacity: 0.18, weight: 2 }).addTo(map);
    L.circleMarker([D.lat, D.lng], { radius: 8, color: '#FFFFFF', fillColor: BIRU, fillOpacity: 1, weight: 3 })
      .addTo(map).bindPopup('<b>' + esc(D.nama) + '</b><br/>Radius presensi: ' + D.radius + ' m');
    var perangkat = null, garis = null;

    function warna(dalam) {
      var w = dalam ? HIJAU : MERAH;
      lingkaran.setStyle({ color: w, fillColor: w, fillOpacity: dalam ? 0.22 : 0.18 });
      return w;
    }
    window.perbarui = function (lat, lng, dalam, jarak) {
      var w = warna(dalam);
      var pertama = !perangkat;
      if (!perangkat) {
        perangkat = L.circleMarker([lat, lng], { radius: 8, color: '#FFFFFF', fillColor: w, fillOpacity: 1, weight: 3 }).addTo(map);
        garis = L.polyline([[lat, lng], [D.lat, D.lng]], { color: w, weight: 3, dashArray: '6 6' }).addTo(map);
      } else {
        perangkat.setLatLng([lat, lng]).setStyle({ fillColor: w });
        garis.setLatLngs([[lat, lng], [D.lat, D.lng]]).setStyle({ color: w });
      }
      perangkat.bindPopup('<b>Posisi kamu</b>' + (jarak !== null ? '<br/>Jarak ke lab: ' + jarak + ' m' : ''));
      if (pertama) map.fitBounds(L.latLngBounds([[lat, lng], [D.lat, D.lng]]).extend(lingkaran.getBounds()), { padding: [24, 24], maxZoom: 19 });
    };
    window.hapusPerangkat = function () {
      if (perangkat) { map.removeLayer(perangkat); map.removeLayer(garis); perangkat = null; garis = null; }
      warna(false);
    };
    window.fokusLab = function () { map.fitBounds(lingkaran.getBounds(), { padding: [24, 24], maxZoom: 19 }); };
    window.fokusPerangkat = function () { if (perangkat) map.setView(perangkat.getLatLng(), 19); };
  }
</script></body></html>`;
  }, [lab]);

  // Kirim status terbaru ke peta tanpa memuat ulang HTML.
  const sinkron = useCallback(() => {
    if (!webRef.current || !lab) return;
    const js = koordinatPerangkat
      ? `window.perbarui && window.perbarui(${koordinatPerangkat.latitude}, ${koordinatPerangkat.longitude}, ${dalamRadius}, ${jarakMeter === null ? 'null' : jarakMeter}); true;`
      : 'window.hapusPerangkat && window.hapusPerangkat(); true;';
    webRef.current.injectJavaScript(js);
  }, [lab, koordinatPerangkat, dalamRadius, jarakMeter]);

  useEffect(() => {
    if (siap) sinkron();
  }, [siap, sinkron]);

  // Lab berganti: HTML dimuat ulang, jadi tunggu sampai siap lagi.
  useEffect(() => {
    setSiap(false);
    setGagal(false);
  }, [html]);

  const jalankan = (js: string) => webRef.current?.injectJavaScript(`${js}; true;`);

  const onMessage = (e: WebViewMessageEvent) => {
    if (e.nativeEvent.data === 'gagal') setGagal(true);
    else if (e.nativeEvent.data === 'ok') setGagal(false);
  };

  if (!lab) {
    return (
      <View style={styles.fallbackBox}>
        <Ikon nama="lokasi" size={28} color={W.sub} />
        <Text style={styles.fallbackText}>Koordinat peta laboratorium belum tersedia untuk ruangan ini.</Text>
      </View>
    );
  }

  const warnaStatus = dalamRadius ? W.green : W.red;

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          nestedScrollEnabled
          onLoadEnd={() => setSiap(true)}
          onError={() => setGagal(true)}
          onHttpError={() => setGagal(true)}
          onMessage={onMessage}
        />

        {gagal && (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={styles.overlayText}>
              Peta tidak dapat dimuat. Periksa koneksi internet. Pemeriksaan lokasi tetap berjalan.
            </Text>
          </View>
        )}

        <View style={styles.controls}>
          <Pressable onPress={() => jalankan('window.fokusLab && window.fokusLab()')} style={styles.ctrlBtn} accessibilityRole="button">
            <Ikon nama="lokasi" size={14} color={W.blue} />
            <Text style={styles.ctrlText}>Titik Lab</Text>
          </Pressable>
          {koordinatPerangkat && (
            <Pressable onPress={() => jalankan('window.fokusPerangkat && window.fokusPerangkat()')} style={styles.ctrlBtn} accessibilityRole="button">
              <Ikon nama="kompas" size={14} color={warnaStatus} />
              <Text style={styles.ctrlText}>Posisi Saya</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: W.blue }]} />
          <Text style={styles.legendText}>
            {lab.nama} ({lab.latitude.toFixed(5)}, {lab.longitude.toFixed(5)}) • radius {lab.radius} m
          </Text>
        </View>
        {koordinatPerangkat && (
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: warnaStatus }]} />
            <Text style={styles.legendText}>
              Perangkat ({koordinatPerangkat.latitude.toFixed(5)}, {koordinatPerangkat.longitude.toFixed(5)})
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
  map: { flex: 1, backgroundColor: W.bg },
  overlay: { position: 'absolute', left: 10, right: 10, top: 10, backgroundColor: 'rgba(18, 19, 22, 0.92)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: W.amber },
  overlayText: { color: W.amber, fontSize: 12, fontWeight: '600', lineHeight: 17 },
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
