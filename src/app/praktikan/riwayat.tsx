import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { userDummy } from '../../constants/dummy';
import {
  CatatanPresensi,
  getRiwayatPraktikan,
} from '../../constants/presensiStore';

export default function RiwayatPresensiPraktikan() {
  const praktikan = userDummy.find((u) => u.role === 'praktikan') || {
    id: 'u-2',
    nama: 'Didi',
    role: 'praktikan',
  };

  const riwayatList = getRiwayatPraktikan(praktikan.id);

  const renderItem = ({ item }: { item: CatatanPresensi }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.namaSesi}>{item.namaSesi}</Text>
        <View style={styles.badgeHadir}>
          <Text style={styles.badgeHadirText}>● {item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.label}>Kelas</Text>
        <Text style={styles.value}>{item.kelas}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Tanggal</Text>
        <Text style={styles.value}>{item.tanggal}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Waktu Kehadiran</Text>
        <Text style={styles.timeHighlight}>{item.waktuKehadiran} WIB</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Info Praktikan */}
      <View style={styles.profileBanner}>
        <Text style={styles.profileName}>{praktikan.nama}</Text>
        <Text style={styles.profileRole}>Praktikan • Total {riwayatList.length} Kehadiran</Text>
      </View>

      {/* Daftar Riwayat Presensi (FR-09) */}
      {riwayatList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Belum Ada Riwayat Presensi</Text>
          <Text style={styles.emptyDesc}>
            Anda belum mengisi presensi pada sesi praktikum manapun.
          </Text>
        </View>
      ) : (
        <FlatList
          data={riwayatList}
          keyExtractor={(item, index) => `${item.sesiId}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileBanner: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  profileRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  namaSesi: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  badgeHadir: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeHadirText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
  },
  value: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  timeHighlight: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
