import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function AttendanceScreen() {
  // 1. Data Dummy Praktikan (Tariq) & Sesi Praktikum
  const student = {
    nim: '2210001',
    name: 'Tariq Al-Fatih',
    className: '3SE1',
  };

  const session = {
    courseName: 'Praktikum Pengembangan Perangkat Komputasi',
    courseCode: 'PPK-2026',
    room: 'Lab Komputer 3',
    time: '10:00 - 12:30 WIB',
    date: 'Kamis, 22 Oktober 2026',
  };

  // 2. State Lokal
  const [isSessionOpen] = useState<boolean>(true);
  const [hasAttended, setHasAttended] = useState<boolean>(false);
  const [attendedAt, setAttendedAt] = useState<string | null>(null);

  // State Modal Feedback (FR-08)
  const [showModal, setShowModal] = useState<boolean>(false);

  // 3. Handler Submit Presensi (FR-07 & FR-08)
  const handleAttendanceSubmit = () => {
    if (!isSessionOpen || hasAttended) {
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setHasAttended(true);
    setAttendedAt(formattedTime);

    // Otomatis munculkan Modal Feedback (FR-08)
    setShowModal(true);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Layar */}
          <View style={styles.header}>
            <ThemedText type="title">Presensi Praktikan</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Silakan isi kehadiran pada sesi praktikum yang sedang berlangsung
            </ThemedText>
          </View>

          {/* Kartu Profil Praktikan */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle">Profil Praktikan</ThemedText>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>PRAKTIKAN</Text>
              </View>
            </View>

            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">Nama Lengkap</ThemedText>
              <ThemedText type="smallBold">{student.name}</ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">NIM</ThemedText>
              <ThemedText type="smallBold">{student.nim}</ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">Kelas</ThemedText>
              <ThemedText type="smallBold">{student.className}</ThemedText>
            </View>
          </ThemedView>

          {/* Kartu Informasi Sesi Praktikum */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle">Sesi Praktikum</ThemedText>
              <View
                style={[
                  styles.statusBadge,
                  isSessionOpen ? styles.statusBadgeOpen : styles.statusBadgeClosed,
                ]}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    isSessionOpen ? styles.statusTextOpen : styles.statusTextClosed,
                  ]}>
                  {isSessionOpen ? '● SESI DIBUKA' : '○ SESI DITUTUP'}
                </Text>
              </View>
            </View>

            <ThemedText type="smallBold" style={styles.courseTitle}>
              {session.courseName}
            </ThemedText>

            <View style={styles.divider} />

            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">Kode Matkul</ThemedText>
              <ThemedText type="small">{session.courseCode}</ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">Jadwal</ThemedText>
              <ThemedText type="small">{session.date}</ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">Waktu Sesi</ThemedText>
              <ThemedText type="small">{session.time}</ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">Ruangan</ThemedText>
              <ThemedText type="small">{session.room}</ThemedText>
            </View>
          </ThemedView>

          {/* Bagian Aksi Presensi */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!isSessionOpen || hasAttended) && styles.submitBtnDisabled,
              ]}
              onPress={handleAttendanceSubmit}
              disabled={!isSessionOpen || hasAttended}
              activeOpacity={0.8}>
              <Text style={styles.submitBtnText}>
                {hasAttended
                  ? '✓ Presensi Sudah Tercatat'
                  : !isSessionOpen
                  ? 'Sesi Belum Dibuka Asisten'
                  : 'Kirim Presensi Sekarang'}
              </Text>
            </TouchableOpacity>

            <ThemedText type="small" themeColor="textSecondary" style={styles.helperText}>
              {hasAttended
                ? `Kehadiran berhasil disimpan pada pukul ${attendedAt} WIB.`
                : !isSessionOpen
                ? 'Sesi praktikum saat ini belum dibuka oleh asisten.'
                : 'Silakan tekan tombol di atas untuk mengisi daftar kehadiran.'}
            </ThemedText>

            {/* Tombol Lihat Bukti jika sudah presensi */}
            {hasAttended && (
              <TouchableOpacity
                style={styles.viewResultBtn}
                onPress={() => setShowModal(true)}
                activeOpacity={0.7}>
                <Text style={styles.viewResultBtnText}>Lihat Bukti Kehadiran</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal Feedback Hasil Presensi (FR-08) */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View style={styles.successIconBadge}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Presensi Berhasil
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.modalSubtitle}>
                Data kehadiran Anda telah tercatat ke dalam sistem
              </ThemedText>
            </View>

            <View style={styles.modalDivider} />

            {/* Rincian Hasil Presensi (FR-08) */}
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <ThemedText type="small" themeColor="textSecondary">Waktu Kehadiran</ThemedText>
                <ThemedText type="smallBold" style={styles.highlightTime}>
                  {attendedAt} WIB
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText type="small" themeColor="textSecondary">Status</ThemedText>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>HADIR</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <ThemedText type="small" themeColor="textSecondary">Praktikan</ThemedText>
                <ThemedText type="small">{student.name}</ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText type="small" themeColor="textSecondary">NIM</ThemedText>
                <ThemedText type="small">{student.nim}</ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText type="small" themeColor="textSecondary">Mata Kuliah</ThemedText>
                <ThemedText type="small">{session.courseName}</ThemedText>
              </View>
            </View>

            {/* Tombol Tutup Modal */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowModal(false)}
              activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: Spacing.six,
  },
  header: {
    marginBottom: Spacing.one,
  },
  card: {
    padding: Spacing.four,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.15)',
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  roleTag: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeOpen: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusBadgeClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextOpen: {
    color: '#16a34a',
  },
  statusTextClosed: {
    color: '#dc2626',
  },
  courseTitle: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionSection: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  helperText: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.two,
  },
  viewResultBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2563eb',
    alignItems: 'center',
    marginTop: 4,
  },
  viewResultBtnText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styling (FR-08)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 4,
  },
  successIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successIconText: {
    color: '#16a34a',
    fontSize: 24,
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    textAlign: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: Spacing.three,
  },
  detailSection: {
    gap: 10,
    marginBottom: Spacing.four,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightTime: {
    color: '#2563eb',
    fontSize: 14,
  },
  statusPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#16a34a',
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
