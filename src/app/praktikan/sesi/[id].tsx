import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { sesiDummy, userDummy } from '../../../constants/dummy';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatRentangWaktu } from '../../../constants/format';
import {
  catatPresensi,
  cekSudahPresensi,
} from '../../../constants/presensiStore';

export default function DetailSesiPraktikan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sesi = sesiDummy.find((s) => s.id === id);
  const praktikan = userDummy.find((u) => u.role === 'praktikan') || {
    id: 'u-2',
    nama: 'Didi',
    role: 'praktikan',
  };

  // Cek apakah sudah pernah presensi di sesi ini dari store persisten
  const existingRecord = sesi ? cekSudahPresensi(sesi.id, praktikan.id) : undefined;

  // State Kehadiran (FR-07)
  const [hasAttended, setHasAttended] = useState<boolean>(!!existingRecord);
  const [attendedAt, setAttendedAt] = useState<string | null>(
    existingRecord ? existingRecord.waktuKehadiran : null
  );

  // State Modal Feedback (FR-08)
  const [showModal, setShowModal] = useState<boolean>(false);

  if (!sesi) {
    return (
      <View style={styles.center}>
        <Text>Sesi tidak ditemukan.</Text>
      </View>
    );
  }

  // Handler Submit Presensi (FR-07 & FR-08)
  const handlePresensi = () => {
    if (sesi.status !== 'dibuka' || hasAttended) {
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const formattedDate = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Simpan ke in-memory store agar riwayat presensi langsung terupdate (FR-09)
    catatPresensi({
      sesiId: sesi.id,
      namaSesi: sesi.nama,
      kelas: sesi.kelas,
      praktikanId: praktikan.id,
      namaPraktikan: praktikan.nama,
      tanggal: formattedDate,
      waktuKehadiran: formattedTime,
      status: 'HADIR',
    });

    setHasAttended(true);
    setAttendedAt(formattedTime);

    // Buka Modal Hasil Presensi & Waktu Kehadiran (FR-08)
    setShowModal(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Info Sesi */}
      <View style={styles.headerRow}>
        <Text style={styles.nama}>{sesi.nama}</Text>
        <StatusBadge status={sesi.status} />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Kelas</Text>
        <Text style={styles.value}>{sesi.kelas}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Waktu</Text>
        <Text style={styles.value}>
          {formatRentangWaktu(sesi.waktuMulai, sesi.waktuSelesai)}
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Status Sesi</Text>
        <Text style={styles.value}>
          {sesi.status === 'belum_dibuka'
            ? 'Sesi belum dibuka oleh asisten. Silakan tunggu.'
            : sesi.status === 'dibuka'
            ? 'Sesi sedang dibuka. Kamu dapat melakukan presensi.'
            : 'Sesi telah ditutup.'}
        </Text>
      </View>

      {/* Bagian Aksi Presensi (FR-07) */}
      {sesi.status === 'belum_dibuka' && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Tombol presensi belum aktif karena sesi belum dibuka.
          </Text>
        </View>
      )}

      {sesi.status === 'ditutup' && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Presensi tidak dapat dilakukan karena sesi telah ditutup.
          </Text>
        </View>
      )}

      {sesi.status === 'dibuka' && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              hasAttended && styles.submitBtnDisabled,
            ]}
            onPress={handlePresensi}
            disabled={hasAttended}
            activeOpacity={0.8}>
            <Text style={styles.submitBtnText}>
              {hasAttended ? '✓ Presensi Sudah Tercatat' : 'Kirim Presensi Sekarang'}
            </Text>
          </TouchableOpacity>

          {/* Keterangan Status Presensi */}
          <Text style={styles.helperText}>
            {hasAttended
              ? `Kehadiran berhasil disimpan pada pukul ${attendedAt} WIB.`
              : 'Pastikan Anda mengikuti praktikum sebelum mengirimkan presensi.'}
          </Text>

          {/* Tombol Lihat Bukti jika sudah presensi (FR-08) */}
          {hasAttended && (
            <TouchableOpacity
              style={styles.viewResultBtn}
              onPress={() => setShowModal(true)}
              activeOpacity={0.7}>
              <Text style={styles.viewResultBtnText}>Lihat Bukti Kehadiran</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modal Feedback Hasil Presensi (FR-08) */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.successIconBadge}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.modalTitle}>Presensi Berhasil</Text>
              <Text style={styles.modalSubtitle}>
                Data kehadiran Anda telah tercatat ke dalam sistem
              </Text>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Waktu Kehadiran</Text>
                <Text style={styles.detailValueHighlight}>{attendedAt} WIB</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>HADIR</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Praktikan</Text>
                <Text style={styles.detailValue}>{praktikan.nama}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mata Praktikum</Text>
                <Text style={styles.detailValue}>{sesi.nama}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kelas</Text>
                <Text style={styles.detailValue}>{sesi.kelas}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowModal(false)}
              activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  nama: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  infoBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 15,
    color: '#111827',
    marginTop: 4,
  },
  placeholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  placeholderText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  actionSection: {
    marginTop: 8,
    gap: 8,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  viewResultBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    alignItems: 'center',
    marginTop: 4,
  },
  viewResultBtnText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 4,
  },
  successIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successIconText: {
    color: '#16A34A',
    fontSize: 22,
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  detailSection: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  detailValueHighlight: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
  statusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});