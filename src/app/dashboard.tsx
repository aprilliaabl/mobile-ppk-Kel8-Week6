import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SessionStatus = 'IDLE' | 'ACTIVE' | 'CLOSED';

export interface Praktikan {
  id: string;
  nim: string;
  name: string;
  waktuHadir: string;
  status: 'TEPAT_WAKTU' | 'TERLAMBAT';
  avatarBg: string;
}

const INITIAL_DUMMY_STUDENTS: Praktikan[] = [
  {
    id: 'p-1',
    nim: '22/492101/TK/54001',
    name: 'Aditya Rizky Pratama',
    waktuHadir: '08:02:15 WIB',
    status: 'TEPAT_WAKTU',
    avatarBg: '#3B82F6',
  },
  {
    id: 'p-2',
    nim: '22/493321/TK/54022',
    name: 'Bella Safitri Maharani',
    waktuHadir: '08:03:41 WIB',
    status: 'TEPAT_WAKTU',
    avatarBg: '#EC4899',
  },
  {
    id: 'p-3',
    nim: '22/494109/TK/54045',
    name: 'Dimas Anggara Saputra',
    waktuHadir: '08:05:12 WIB',
    status: 'TEPAT_WAKTU',
    avatarBg: '#10B981',
  },
  {
    id: 'p-4',
    nim: '22/495218/TK/54060',
    name: 'Eka Nur Wahyuni',
    waktuHadir: '08:06:55 WIB',
    status: 'TEPAT_WAKTU',
    avatarBg: '#8B5CF6',
  },
  {
    id: 'p-5',
    nim: '22/496733/TK/54088',
    name: 'Fajar Hidayatullah',
    waktuHadir: '08:09:03 WIB',
    status: 'TEPAT_WAKTU',
    avatarBg: '#F59E0B',
  },
  {
    id: 'p-6',
    nim: '22/497812/TK/54102',
    name: 'Gita Permatasari',
    waktuHadir: '08:17:20 WIB',
    status: 'TERLAMBAT',
    avatarBg: '#EF4444',
  },
  {
    id: 'p-7',
    nim: '22/498901/TK/54120',
    name: 'Hendra Wijaya',
    waktuHadir: '08:19:45 WIB',
    status: 'TERLAMBAT',
    avatarBg: '#6366F1',
  },
  {
    id: 'p-8',
    nim: '22/499120/TK/54135',
    name: 'Indah Kusuma Wardani',
    waktuHadir: '08:22:10 WIB',
    status: 'TERLAMBAT',
    avatarBg: '#14B8A6',
  },
];

const SIMULATION_POOL: Omit<Praktikan, 'id' | 'waktuHadir'>[] = [
  {
    nim: '22/500111/TK/54150',
    name: 'Joko Prasetyo Utomo',
    status: 'TEPAT_WAKTU',
    avatarBg: '#0284C7',
  },
  {
    nim: '22/501222/TK/54162',
    name: 'Kartika Chandra Dewi',
    status: 'TERLAMBAT',
    avatarBg: '#D97706',
  },
  {
    nim: '22/502333/TK/54175',
    name: 'Lukman Nur Hakim',
    status: 'TEPAT_WAKTU',
    avatarBg: '#059669',
  },
];

const TOTAL_ENROLLED_STUDENTS = 25;

function formatCurrentTime(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} WIB`;
}

export default function AssistantDashboardScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // FR-04 & FR-05 state
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('IDLE');
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<string | null>(null);

  // FR-06 dummy attendance state
  const [attendanceList, setAttendanceList] = useState<Praktikan[]>([]);
  const [simulationIndex, setSimulationIndex] = useState(0);

  // Modal konfirmasi tindakan state
  const [modalAction, setModalAction] = useState<'OPEN' | 'CLOSE' | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'TEPAT_WAKTU' | 'TERLAMBAT'>('ALL');

  // Trigger modal
  const handleRequestOpenSession = () => {
    setModalAction('OPEN');
  };

  const handleRequestCloseSession = () => {
    setModalAction('CLOSE');
  };

  const handleDismissModal = () => {
    setModalAction(null);
  };

  // Confirm FR-04: Membuka sesi praktikum
  const handleConfirmOpenSession = () => {
    const time = formatCurrentTime();
    setSessionStatus('ACTIVE');
    setSessionStartTime(time);
    setSessionEndTime(null);
    setAttendanceList(INITIAL_DUMMY_STUDENTS);
    setSimulationIndex(0);
    setModalAction(null);
  };

  // Confirm FR-05: Menutup sesi praktikum
  const handleConfirmCloseSession = () => {
    const time = formatCurrentTime();
    setSessionStatus('CLOSED');
    setSessionEndTime(time);
    setModalAction(null);
  };

  // Reset sesi (untuk pengujian ulang demonstrasi)
  const handleResetSession = () => {
    setSessionStatus('IDLE');
    setSessionStartTime(null);
    setSessionEndTime(null);
    setAttendanceList([]);
    setSimulationIndex(0);
    setSearchQuery('');
    setFilterStatus('ALL');
  };

  // Simulasi praktikan melakukan presensi saat sesi aktif
  const handleSimulateCheckIn = () => {
    if (simulationIndex >= SIMULATION_POOL.length) {
      return;
    }
    const candidate = SIMULATION_POOL[simulationIndex];
    const newStudent: Praktikan = {
      ...candidate,
      id: `sim-${Date.now()}-${simulationIndex}`,
      waktuHadir: formatCurrentTime(),
    };
    setAttendanceList((prev) => [newStudent, ...prev]);
    setSimulationIndex((prev) => prev + 1);
  };

  // Rekap calculations (FR-06)
  const totalHadir = attendanceList.length;
  const totalTepatWaktu = useMemo(
    () => attendanceList.filter((item) => item.status === 'TEPAT_WAKTU').length,
    [attendanceList]
  );
  const totalTerlambat = useMemo(
    () => attendanceList.filter((item) => item.status === 'TERLAMBAT').length,
    [attendanceList]
  );
  const attendancePercentage = useMemo(() => {
    return Math.round((totalHadir / TOTAL_ENROLLED_STUDENTS) * 100);
  }, [totalHadir]);

  // Filtered attendance list
  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nim.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = filterStatus === 'ALL' || item.status === filterStatus;
      return matchSearch && matchFilter;
    });
  }, [attendanceList, searchQuery, filterStatus]);

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top + Spacing.three,
      paddingLeft: insets.left + Spacing.four,
      paddingRight: insets.right + Spacing.four,
      paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
    },
    ios: {
      paddingTop: insets.top + Spacing.three,
      paddingLeft: insets.left + Spacing.four,
      paddingRight: insets.right + Spacing.four,
      paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
    },
    web: {
      paddingTop: Spacing.five,
      paddingBottom: Spacing.six,
      paddingHorizontal: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.scrollContent, contentPlatformStyle]}>
      <View style={styles.container}>
        {/* Header Asisten & Praktikum */}
        <ThemedView type="backgroundElement" style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.ownerBadge}>
              <ThemedText type="code" style={styles.ownerText}>
                OWNER: ASSISTANT
              </ThemedText>
            </View>
            <View
              style={[
                styles.statusIndicator,
                sessionStatus === 'ACTIVE'
                  ? styles.statusActive
                  : sessionStatus === 'CLOSED'
                    ? styles.statusClosed
                    : styles.statusIdle,
              ]}>
              <View
                style={[
                  styles.statusDot,
                  sessionStatus === 'ACTIVE'
                    ? styles.dotActive
                    : sessionStatus === 'CLOSED'
                      ? styles.dotClosed
                      : styles.dotIdle,
                ]}
              />
              <ThemedText type="smallBold" style={styles.statusIndicatorText}>
                {sessionStatus === 'ACTIVE'
                  ? 'Sesi Aktif'
                  : sessionStatus === 'CLOSED'
                    ? 'Sesi Selesai'
                    : 'Sesi Belum Dibuka'}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="title" style={styles.headerTitle}>
            Dashboard Asisten
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary">
            Praktikum Pemrograman Perangkat Keras (PPK) • Kelompok 8
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Topik: Modul Pengelolaan Sesi & Rekap Presensi Praktikum
          </ThemedText>
        </ThemedView>

        {/* Section Kontrol Sesi (FR-04 & FR-05) */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <ThemedText type="subtitle" style={styles.sectionHeading}>
                Kontrol Sesi Praktikum
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Kelola pembukaan dan penutupan sesi presensi praktikan
              </ThemedText>
            </View>
            {sessionStatus !== 'IDLE' && (
              <Pressable
                onPress={handleResetSession}
                style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
                <SymbolView
                  name={{ ios: 'arrow.counterclockwise', android: 'refresh', web: 'refresh' }}
                  size={12}
                  tintColor={theme.textSecondary}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  Reset
                </ThemedText>
              </Pressable>
            )}
          </View>

          {/* Sesi info timeline */}
          <View style={styles.sessionMetaGrid}>
            <View style={styles.sessionMetaItem}>
              <ThemedText type="small" themeColor="textSecondary">
                Waktu Dibuka:
              </ThemedText>
              <ThemedText type="smallBold">
                {sessionStartTime ? sessionStartTime : '—'}
              </ThemedText>
            </View>
            <View style={styles.sessionMetaItem}>
              <ThemedText type="small" themeColor="textSecondary">
                Waktu Ditutup:
              </ThemedText>
              <ThemedText type="smallBold">
                {sessionEndTime ? sessionEndTime : '—'}
              </ThemedText>
            </View>
            <View style={styles.sessionMetaItem}>
              <ThemedText type="small" themeColor="textSecondary">
                Ruang Lab:
              </ThemedText>
              <ThemedText type="smallBold">Lab Komputasi 301</ThemedText>
            </View>
          </View>

          {/* Action Buttons: FR-04 & FR-05 */}
          <View style={styles.actionsContainer}>
            {/* Tombol Buka Sesi (FR-04) */}
            <Pressable
              disabled={sessionStatus === 'ACTIVE'}
              onPress={handleRequestOpenSession}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.btnOpen,
                sessionStatus === 'ACTIVE' && styles.btnDisabled,
                pressed && sessionStatus !== 'ACTIVE' && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
                size={18}
                tintColor="#ffffff"
              />
              <ThemedText style={styles.btnTextPrimary}>
                {sessionStatus === 'ACTIVE' ? 'Sesi Sedang Dibuka' : 'Buka Sesi Praktikum'}
              </ThemedText>
            </Pressable>

            {/* Tombol Tutup Sesi (FR-05) */}
            <Pressable
              disabled={sessionStatus !== 'ACTIVE'}
              onPress={handleRequestCloseSession}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.btnClose,
                sessionStatus !== 'ACTIVE' && styles.btnDisabled,
                pressed && sessionStatus === 'ACTIVE' && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'stop.fill', android: 'stop', web: 'stop' }}
                size={18}
                tintColor="#ffffff"
              />
              <ThemedText style={styles.btnTextPrimary}>Tutup Sesi Praktikum</ThemedText>
            </Pressable>
          </View>

          {/* Helper Simulation button during active session */}
          {sessionStatus === 'ACTIVE' && (
            <View style={styles.simulationBanner}>
              <View style={styles.simTextContainer}>
                <ThemedText type="smallBold">Uji Coba Presensi Real-Time</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Simulasikan kedatangan praktikan dummy ke dalam daftar rekap.
                </ThemedText>
              </View>
              <Pressable
                disabled={simulationIndex >= SIMULATION_POOL.length}
                onPress={handleSimulateCheckIn}
                style={({ pressed }) => [
                  styles.simButton,
                  simulationIndex >= SIMULATION_POOL.length && styles.btnDisabled,
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
                  size={14}
                  tintColor="#ffffff"
                />
                <ThemedText style={styles.simButtonText}>
                  {simulationIndex >= SIMULATION_POOL.length
                    ? 'Semua Hadir'
                    : '+ Simulasikan Presensi'}
                </ThemedText>
              </Pressable>
            </View>
          )}
        </ThemedView>

        {/* Section Rekap Kehadiran (FR-06) */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.rekapHeaderRow}>
            <View>
              <ThemedText type="subtitle" style={styles.sectionHeading}>
                Rekap Kehadiran Praktikan
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Pemantauan kehadiran dan log presensi praktikum
              </ThemedText>
            </View>
            <ThemedView type="backgroundSelected" style={styles.totalBadge}>
              <ThemedText type="smallBold">
                {sessionStatus === 'IDLE' ? '0/25' : `${totalHadir}/${TOTAL_ENROLLED_STUDENTS}`} Mhs
              </ThemedText>
            </ThemedView>
          </View>

          {/* Summary Stat Cards */}
          <View style={styles.statsRow}>
            <ThemedView type="backgroundSelected" style={styles.statBox}>
              <ThemedText type="small" themeColor="textSecondary">
                Total Hadir
              </ThemedText>
              <ThemedText type="subtitle" style={styles.statNumber}>
                {sessionStatus === 'IDLE' ? '0' : totalHadir}
              </ThemedText>
              <ThemedText type="code" style={styles.statSub}>
                {sessionStatus === 'IDLE' ? '0%' : `${attendancePercentage}%`}
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundSelected" style={styles.statBox}>
              <ThemedText type="small" themeColor="textSecondary">
                Tepat Waktu
              </ThemedText>
              <ThemedText type="subtitle" style={[styles.statNumber, { color: '#10B981' }]}>
                {sessionStatus === 'IDLE' ? '0' : totalTepatWaktu}
              </ThemedText>
              <ThemedText type="code" style={styles.statSub}>
                Sebelum 08:15
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundSelected" style={styles.statBox}>
              <ThemedText type="small" themeColor="textSecondary">
                Terlambat
              </ThemedText>
              <ThemedText type="subtitle" style={[styles.statNumber, { color: '#F59E0B' }]}>
                {sessionStatus === 'IDLE' ? '0' : totalTerlambat}
              </ThemedText>
              <ThemedText type="code" style={styles.statSub}>
                Setelah 08:15
              </ThemedText>
            </ThemedView>
          </View>

          {/* TAMPILAN REKAP KOSONG (Saat sesi belum dibuka) */}
          {sessionStatus === 'IDLE' ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconCircle}>
                <SymbolView
                  name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
                  size={36}
                  tintColor={theme.textSecondary}
                />
              </View>
              <ThemedText type="default" style={styles.emptyStateTitle}>
                Tampilan Rekap Kosong
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyStateDesc}>
                Sesi praktikum belum dibuka. Silakan tekan tombol{' '}
                <ThemedText type="smallBold">&quot;Buka Sesi Praktikum&quot;</ThemedText> di atas untuk
                membuka akses presensi bagi praktikan dan menampilkan data kehadiran secara
                real-time.
              </ThemedText>
            </View>
          ) : (
            /* DAFTAR PRAKTIKAN DUMMY BESERTA WAKTU KEHADIRAN */
            <View style={styles.attendanceSection}>
              {/* Search & Filter Toolbar */}
              <View style={styles.filterToolbar}>
                <View
                  style={[
                    styles.searchInputWrapper,
                    { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
                  ]}>
                  <SymbolView
                    name={{
                      ios: 'magnifyingglass',
                      android: 'search',
                      web: 'search',
                    }}
                    size={16}
                    tintColor={theme.textSecondary}
                  />
                  <TextInput
                    placeholder="Cari nama atau NIM..."
                    placeholderTextColor={theme.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={[styles.searchInput, { color: theme.text }]}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <SymbolView
                        name={{
                          ios: 'xmark.circle.fill',
                          android: 'cancel',
                          web: 'cancel',
                        }}
                        size={16}
                        tintColor={theme.textSecondary}
                      />
                    </Pressable>
                  )}
                </View>

                {/* Filter Chips */}
                <View style={styles.filterChipsRow}>
                  <Pressable
                    onPress={() => setFilterStatus('ALL')}
                    style={[
                      styles.filterChip,
                      filterStatus === 'ALL' && styles.filterChipActive,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={[
                        styles.filterChipText,
                        filterStatus === 'ALL' && styles.filterChipTextActive,
                      ]}>
                      Semua ({attendanceList.length})
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => setFilterStatus('TEPAT_WAKTU')}
                    style={[
                      styles.filterChip,
                      filterStatus === 'TEPAT_WAKTU' && styles.filterChipActive,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={[
                        styles.filterChipText,
                        filterStatus === 'TEPAT_WAKTU' && styles.filterChipTextActive,
                      ]}>
                      Tepat Waktu ({totalTepatWaktu})
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => setFilterStatus('TERLAMBAT')}
                    style={[
                      styles.filterChip,
                      filterStatus === 'TERLAMBAT' && styles.filterChipActive,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={[
                        styles.filterChipText,
                        filterStatus === 'TERLAMBAT' && styles.filterChipTextActive,
                      ]}>
                      Terlambat ({totalTerlambat})
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* List of Praktikan Items */}
              {filteredAttendance.length === 0 ? (
                <View style={styles.noFilterResult}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Tidak ditemukan praktikan dengan kata kunci &quot;{searchQuery}&quot;.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.studentList}>
                  {filteredAttendance.map((student, idx) => (
                    <ThemedView
                      key={student.id}
                      type="backgroundSelected"
                      style={styles.studentCard}>
                      <View style={styles.studentLeft}>
                        <View style={[styles.avatar, { backgroundColor: student.avatarBg }]}>
                          <ThemedText style={styles.avatarText}>
                            {student.name.charAt(0)}
                          </ThemedText>
                        </View>
                        <View style={styles.studentInfo}>
                          <ThemedText type="smallBold">{student.name}</ThemedText>
                          <ThemedText type="code" style={styles.nimText}>
                            {student.nim}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.studentRight}>
                        <View
                          style={[
                            styles.badgePill,
                            student.status === 'TEPAT_WAKTU'
                              ? styles.badgePillSuccess
                              : styles.badgePillWarning,
                          ]}>
                          <ThemedText
                            type="code"
                            style={
                              student.status === 'TEPAT_WAKTU'
                                ? styles.badgeTextSuccess
                                : styles.badgeTextWarning
                            }>
                            {student.status === 'TEPAT_WAKTU' ? 'TEPAT WAKTU' : 'TERLAMBAT'}
                          </ThemedText>
                        </View>
                        <View style={styles.timeRow}>
                          <SymbolView
                            name={{
                              ios: 'clock',
                              android: 'schedule',
                              web: 'schedule',
                            }}
                            size={11}
                            tintColor={theme.textSecondary}
                          />
                          <ThemedText type="code" style={styles.timestampText}>
                            {student.waktuHadir}
                          </ThemedText>
                        </View>
                      </View>
                    </ThemedView>
                  ))}
                </View>
              )}
            </View>
          )}
        </ThemedView>
      </View>

      {/* MODAL KONFIRMASI TINDAKAN (BUKA SESI / TUTUP SESI) */}
      <Modal
        visible={modalAction !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDismissModal}>
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={styles.modalContainer}>
            {/* Modal Icon Header */}
            <View
              style={[
                styles.modalIconWrap,
                modalAction === 'OPEN' ? styles.modalIconOpen : styles.modalIconClose,
              ]}>
              <SymbolView
                name={
                  modalAction === 'OPEN'
                    ? { ios: 'play.circle.fill', android: 'play_circle', web: 'play_circle' }
                    : {
                        ios: 'exclamationmark.triangle.fill',
                        android: 'warning',
                        web: 'warning',
                      }
                }
                size={32}
                tintColor={modalAction === 'OPEN' ? '#10B981' : '#EF4444'}
              />
            </View>

            {/* Modal Text Content */}
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {modalAction === 'OPEN'
                ? 'Konfirmasi Buka Sesi'
                : 'Konfirmasi Tutup Sesi'}
            </ThemedText>

            <ThemedText type="default" themeColor="textSecondary" style={styles.modalDescription}>
              {modalAction === 'OPEN'
                ? 'Apakah Anda yakin ingin membuka sesi praktikum ini? Praktikan akan diizinkan melakukan presensi kehadiran secara langsung.'
                : 'Apakah Anda yakin ingin menutup sesi praktikum? Sesi yang ditutup akan mengunci seluruh data kehadiran dan menyusun rekap akhir.'}
            </ThemedText>

            {/* Modal Highlights Box */}
            <ThemedView type="backgroundSelected" style={styles.modalInfoBox}>
              <View style={styles.modalInfoRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Praktikum:
                </ThemedText>
                <ThemedText type="smallBold">PPK - Lab 301</ThemedText>
              </View>
              <View style={styles.modalInfoRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Waktu Eksekusi:
                </ThemedText>
                <ThemedText type="code">{formatCurrentTime()}</ThemedText>
              </View>
            </ThemedView>

            {/* Modal Buttons */}
            <View style={styles.modalButtonGroup}>
              <Pressable
                onPress={handleDismissModal}
                style={({ pressed }) => [styles.modalBtnCancel, pressed && styles.pressed]}>
                <ThemedText type="smallBold">Batal</ThemedText>
              </Pressable>

              <Pressable
                onPress={
                  modalAction === 'OPEN' ? handleConfirmOpenSession : handleConfirmCloseSession
                }
                style={({ pressed }) => [
                  styles.modalBtnConfirm,
                  modalAction === 'OPEN'
                    ? styles.modalBtnConfirmOpen
                    : styles.modalBtnConfirmClose,
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={styles.modalBtnConfirmText}>
                  {modalAction === 'OPEN' ? 'Ya, Buka Sesi' : 'Ya, Tutup Sesi'}
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  headerCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.one,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  ownerBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  ownerText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.three,
  },
  statusIdle: {
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotIdle: {
    backgroundColor: '#9CA3AF',
  },
  dotActive: {
    backgroundColor: '#10B981',
  },
  dotClosed: {
    backgroundColor: '#EF4444',
  },
  statusIndicatorText: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 38,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 20,
    lineHeight: 26,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sessionMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  sessionMetaItem: {
    flex: 1,
    minWidth: 120,
    gap: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  actionBtn: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  btnOpen: {
    backgroundColor: '#10B981',
  },
  btnClose: {
    backgroundColor: '#EF4444',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnTextPrimary: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  simulationBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    marginTop: Spacing.one,
  },
  simTextContainer: {
    flex: 1,
    minWidth: 200,
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: '#3B82F6',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  simButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  rekapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statBox: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.half,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  statSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  emptyStateIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(156, 163, 175, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyStateTitle: {
    fontWeight: '700',
    fontSize: 17,
    textAlign: 'center',
  },
  emptyStateDesc: {
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 20,
  },
  attendanceSection: {
    gap: Spacing.three,
  },
  filterToolbar: {
    gap: Spacing.two,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two : Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  noFilterResult: {
    padding: Spacing.four,
    alignItems: 'center',
  },
  studentList: {
    gap: Spacing.two,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  nimText: {
    fontSize: 11,
    color: '#6B7280',
  },
  studentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badgePill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
  badgePillSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgePillWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  badgeTextSuccess: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 10,
  },
  badgeTextWarning: {
    color: '#D97706',
    fontWeight: '700',
    fontSize: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timestampText: {
    fontSize: 11,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    padding: Spacing.five,
    borderRadius: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  modalIconClose: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  modalDescription: {
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
  },
  modalInfoBox: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnConfirmOpen: {
    backgroundColor: '#10B981',
  },
  modalBtnConfirmClose: {
    backgroundColor: '#EF4444',
  },
  modalBtnConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
  },
});
