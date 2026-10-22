import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { JadwalList } from '../../features/session/components/JadwalList';
import { sesiDummy, userDummy } from '../../constants/dummy';
import { presensiStore } from '../../constants/presensiStore';

export default function BerandaPraktikan() {
  const router = useRouter();
  const praktikan = userDummy.find((u) => u.role === 'praktikan')!;
  const jumlahHadir = presensiStore.filter((p) => p.praktikanId === praktikan.id).length;

  return (
    <View style={styles.container}>
      {/* Sapaan & Banner Navigasi Riwayat (FR-09) */}
      <View style={styles.topCard}>
        <View>
          <Text style={styles.sapaan}>Halo, {praktikan.nama}</Text>
          <Text style={styles.subtext}>Praktikan • {jumlahHadir} Presensi Tercatat</Text>
        </View>
        <TouchableOpacity
          style={styles.riwayatBtn}
          onPress={() => router.push('/praktikan/riwayat')}
          activeOpacity={0.8}>
          <Text style={styles.riwayatBtnText}>Lihat Riwayat</Text>
        </TouchableOpacity>
      </View>

      <JadwalList sesiList={sesiDummy} role="praktikan" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  topCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sapaan: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  riwayatBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  riwayatBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});