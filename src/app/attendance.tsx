import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
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

  // 2. State Lokal untuk Interaksi
  // Sesi default dibuka (bisa diubah via saklar simulasi untuk demo)
  const [isSessionOpen, setIsSessionOpen] = useState<boolean>(true);
  
  // Status apakah praktikan sudah presensi di sesi ini (pencegahan ganda)
  const [hasAttended, setHasAttended] = useState<boolean>(false);
  
  // Waktu kehadiran saat presensi berhasil dilakukan
  const [attendedAt, setAttendedAt] = useState<string | null>(null);

  // 3. Handler Submit Presensi (FR-07)
  const handleAttendanceSubmit = () => {
    // Validasi 1: Jangan proses jika sesi belum dibuka asisten
    if (!isSessionOpen) {
      return;
    }

    // Validasi 2: Cegah presensi ganda jika sudah pernah submit
    if (hasAttended) {
      return;
    }

    // Catat waktu kehadiran saat ini
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setHasAttended(true);
    setAttendedAt(formattedTime);
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
              {/* Badge Status Sesi */}
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

            {/* Keterangan Status Presensi */}
            <ThemedText type="small" themeColor="textSecondary" style={styles.helperText}>
              {hasAttended
                ? `Kehadiran berhasil disimpan pada pukul ${attendedAt} WIB.`
                : !isSessionOpen
                ? 'Sesi praktikum saat ini belum dibuka oleh asisten.'
                : 'Silakan tekan tombol di atas untuk mengisi daftar kehadiran.'}
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  demoPanel: {
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderRadius: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(150, 150, 150, 0.25)',
  },
  toggleBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtnOpen: {
    backgroundColor: '#16a34a',
  },
  toggleBtnClose: {
    backgroundColor: '#e11d48',
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
