import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { formatJamRentang, formatTanggal } from '../constants/format';
import { useJadwalLaboratorium } from '../constants/laboratorium';
import type { Role, Sesi } from '../constants/types';
import { W } from '../constants/warna';
import { Ikon } from './Ikon';
import { StatusBadge } from './StatusBadge';

interface Props {
  daftarSesi: Sesi[];
  role: Role;
}

/**
 * FR-21: Komponen untuk menampilkan praktikum yang sedang berlangsung
 * dan praktikum berikutnya pada setiap laboratorium.
 */
export function JadwalLaboratoriumSection({ daftarSesi, role }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cols = width >= 920 ? 2 : 1;
  const jadwalLab = useJadwalLaboratorium(daftarSesi);

  const bukaSesi = (sesi: Sesi) => {
    router.push(`/${role}/sesi/${sesi.id}` as never);
  };

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>
            Status Praktikum per Laboratorium
          </Text>
          <Text style={styles.sectionSub}>
            Pantau praktikum yang sedang berlangsung dan jadwal berikutnya di
            setiap laboratorium
          </Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{jadwalLab.length} Lab</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {jadwalLab.map((item) => {
          const { laboratorium, sedangBerlangsung, berikutnya, antreanBerikutnya } =
            item;
          const adaAktif = !!sedangBerlangsung;

          return (
            <View
              key={laboratorium.id}
              style={{ width: `${100 / cols}%`, padding: 6 }}
            >
              <View
                style={[
                  styles.labCard,
                  adaAktif && { borderColor: W.green },
                ]}
              >
                {/* Header Nama Laboratorium */}
                <View style={styles.labHead}>
                  <View style={styles.labIconCircle}>
                    <Ikon
                      nama="lokasi"
                      size={18}
                      color={adaAktif ? W.green : W.blue}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.labName}>{laboratorium.nama}</Text>
                    {!!laboratorium.gedung && (
                      <Text style={styles.labGedung}>
                        {laboratorium.gedung}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.stateBadge,
                      {
                        backgroundColor: adaAktif
                          ? W.greenSoft
                          : W.graySoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stateBadgeText,
                        { color: adaAktif ? W.green : W.sub },
                      ]}
                    >
                      {adaAktif ? '● DIGUNAKAN' : '● TERSEDIA'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Bagian 1: Praktikum yang Sedang Berlangsung */}
                <View style={styles.slotBox}>
                  <Text
                    style={[
                      styles.slotLabel,
                      { color: adaAktif ? W.green : W.sub },
                    ]}
                  >
                    SEDANG BERLANGSUNG
                  </Text>
                  {sedangBerlangsung ? (
                    <Pressable
                      onPress={() => bukaSesi(sedangBerlangsung)}
                      style={({ pressed }) => [
                        styles.activeSessionCard,
                        pressed && { opacity: 0.85 },
                      ]}
                      accessibilityRole="button"
                    >
                      <View style={styles.sessionTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sessionName}>
                            {sedangBerlangsung.nama}
                          </Text>
                          <Text style={styles.sessionMeta}>
                            Kelas {sedangBerlangsung.kelas} •{' '}
                            {formatJamRentang(
                              sedangBerlangsung.waktuMulai,
                              sedangBerlangsung.waktuSelesai
                            )}
                          </Text>
                        </View>
                        <StatusBadge status={sedangBerlangsung.status} />
                      </View>
                    </Pressable>
                  ) : (
                    <View style={styles.emptySlotBox}>
                      <Text style={styles.emptySlotText}>
                        Tidak ada praktikum yang sedang berlangsung saat ini.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Bagian 2: Praktikum Berikutnya */}
                <View style={styles.slotBox}>
                  <View style={styles.nextHeaderRow}>
                    <Text style={[styles.slotLabel, { color: W.blue }]}>
                      PRAKTIKUM BERIKUTNYA
                    </Text>
                    {antreanBerikutnya.length > 1 && (
                      <Text style={styles.moreQueueText}>
                        +{antreanBerikutnya.length - 1} jadwal lainnya
                      </Text>
                    )}
                  </View>
                  {berikutnya ? (
                    <Pressable
                      onPress={() => bukaSesi(berikutnya)}
                      style={({ pressed }) => [
                        styles.nextSessionCard,
                        pressed && { opacity: 0.85 },
                      ]}
                      accessibilityRole="button"
                    >
                      <View style={styles.sessionTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sessionName}>
                            {berikutnya.nama}
                          </Text>
                          <Text style={styles.sessionMeta}>
                            Kelas {berikutnya.kelas} •{' '}
                            {formatTanggal(berikutnya.waktuMulai)} (
                            {formatJamRentang(
                              berikutnya.waktuMulai,
                              berikutnya.waktuSelesai
                            )}
                            )
                          </Text>
                        </View>
                        <Ikon nama="panah" size={14} color={W.sub} />
                      </View>
                    </Pressable>
                  ) : (
                    <View style={styles.emptySlotBox}>
                      <Text style={styles.emptySlotText}>
                        Belum ada jadwal praktikum berikutnya.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: { marginTop: 14, gap: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: W.text },
  sectionSub: { fontSize: 12, color: W.sub, marginTop: 2 },
  countPill: {
    backgroundColor: W.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: W.line,
  },
  countText: { fontSize: 12, fontWeight: '800', color: W.blue },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  labCard: {
    backgroundColor: W.card,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: W.line,
  },
  labHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  labIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: W.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labName: { fontSize: 16, fontWeight: '800', color: W.text },
  labGedung: { fontSize: 11, color: W.sub, marginTop: 1 },
  stateBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  stateBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  divider: { height: 1, backgroundColor: W.line },
  slotBox: { gap: 6 },
  nextHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  moreQueueText: { fontSize: 10, fontWeight: '700', color: W.blue },
  activeSessionCard: {
    backgroundColor: W.greenSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: W.green,
  },
  nextSessionCard: {
    backgroundColor: W.cardAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: W.line,
  },
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sessionName: { fontSize: 14, fontWeight: '800', color: W.text },
  sessionMeta: { fontSize: 12, color: W.sub, marginTop: 2 },
  emptySlotBox: {
    backgroundColor: W.bg,
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: W.line,
  },
  emptySlotText: { fontSize: 12, color: W.sub, fontStyle: 'italic' },
});
