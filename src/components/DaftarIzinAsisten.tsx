import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PengajuanIzin } from '../constants/types';
import { userDummy } from '../constants/dummy';
import { prosesKeputusanIzin } from '../constants/izinStore';
import { inisial } from '../constants/format';
import { W, warnaAvatar } from '../constants/warna';
import { Button } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { EmptyState } from './EmptyState';

interface Props {
  data: PengajuanIzin[];
  tampilkanInfoSesi?: boolean;
}

function warnaStatusIzin(status: PengajuanIzin['status']) {
  if (status === 'disetujui') {
    return { bg: W.greenSoft, fg: W.green, teks: 'DISETUJUI' };
  }
  if (status === 'ditolak') {
    return { bg: W.redSoft, fg: W.red, teks: 'DITOLAK' };
  }
  return { bg: 'rgba(245,158,11,0.16)', fg: W.amber, teks: 'MENUNGGU' };
}

function warnaKategoriAI(kategori?: string) {
  if (kategori === 'SAKIT_MEDIS' || kategori === 'DARURAT_KELUARGA') {
    return { bg: W.greenSoft, fg: W.green };
  }
  if (kategori === 'AKADEMIK_DISPENSASI' || kategori === 'KEPERLUAN_PRIBADI') {
    return { bg: W.blueSoft, fg: W.blue };
  }
  return { bg: 'rgba(245,158,11,0.16)', fg: W.amber };
}

/**
 * FR-13: Komponen pengelolaan pengajuan izin untuk asisten beserta referensi klasifikasi AI.
 */
export function DaftarIzinAsisten({ data, tampilkanInfoSesi = false }: Props) {
  const asisten = userDummy.find((u) => u.role === 'asisten');
  const [targetModal, setTargetModal] = useState<{
    izin: PengajuanIzin;
    keputusan: 'disetujui' | 'ditolak';
  } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorPesan, setErrorPesan] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <EmptyState
        ikon="kosong"
        judul="Belum ada pengajuan izin"
        deskripsi="Permohonan izin ketidakhadiran dari praktikan beserta hasil klasifikasi AI akan tampil di sini."
      />
    );
  }

  const eksekusiKeputusan = async () => {
    if (!targetModal || processingId) return;
    setProcessingId(targetModal.izin.id);
    setErrorPesan(null);

    const hasil = await prosesKeputusanIzin({
      izinId: targetModal.izin.id,
      keputusan: targetModal.keputusan,
      asisten,
    });

    setProcessingId(null);
    if (!hasil.ok) {
      setErrorPesan(hasil.error ?? 'Gagal memproses pengajuan izin.');
      return;
    }
    setTargetModal(null);
  };

  return (
    <View style={styles.wrap}>
      {!!errorPesan && (
        <View style={styles.errBox}>
          <Text style={styles.errText}>{errorPesan}</Text>
        </View>
      )}

      {data.map((item) => {
        const badge = warnaStatusIzin(item.status);
        const ai = item.klasifikasiAI;
        const aiBadge = warnaKategoriAI(ai?.kategori);
        const sedangPending = item.status === 'pending';

        return (
          <View key={item.id} style={styles.card}>
            {/* Header informasi praktikan & status pengajuan */}
            <View style={styles.head}>
              <View style={[styles.avatar, { backgroundColor: warnaAvatar(item.namaPraktikan) }]}>
                <Text style={styles.avatarText}>{inisial(item.namaPraktikan)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nama}>{item.namaPraktikan}</Text>
                <Text style={styles.nim}>
                  NIM: {item.nimPraktikan}
                  {tampilkanInfoSesi ? ` • ${item.namaSesi} (${item.kelas})` : ''}
                </Text>
                <Text style={styles.waktu}>
                  Diajukan: {item.tanggalPengajuan} • {item.waktuPengajuan} WIB
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                <Text style={[styles.statusPillText, { color: badge.fg }]}>{badge.teks}</Text>
              </View>
            </View>

            {/* Alasan ketidakhadiran praktikan */}
            <View style={styles.alasanBox}>
              <Text style={styles.alasanLabel}>ALASAN KETIDAKHADIRAN</Text>
              <Text style={styles.alasanText}>&quot;{item.alasan}&quot;</Text>
            </View>

            {/* Hasil klasifikasi AI sebagai referensi asisten (FR-12 & FR-13) */}
            <View style={styles.aiBox}>
              <View style={styles.aiHeader}>
                <Text style={styles.aiTitle}>KLASIFIKASI AI (REFERENSI ASISTEN)</Text>
                <View style={[styles.aiPill, { backgroundColor: aiBadge.bg }]}>
                  <Text style={[styles.aiPillText, { color: aiBadge.fg }]}>
                    {ai?.rekomendasi ?? 'Perlu Tinjauan Manual'}
                  </Text>
                </View>
              </View>
              <Text style={styles.aiDesc}>
                {ai?.catatanReferensi ??
                  'Klasifikasi AI digunakan sebagai rekomendasi awal. Keputusan akhir ditentukan oleh asisten.'}
              </Text>
              <Text style={styles.aiMeta}>
                Sentimen model: {ai?.label ? ai.label.toUpperCase() : 'TIDAK TERKLASIFIKASI'} (status:{' '}
                {ai?.status ?? 'none'})
              </Text>
            </View>

            {/* Tombol keputusan asisten atau keterangan sudah diproses */}
            {sedangPending ? (
              <View style={styles.actions}>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Setujui Izin"
                    variant="success"
                    disabled={processingId === item.id}
                    onPress={() => {
                      setErrorPesan(null);
                      setTargetModal({ izin: item, keputusan: 'disetujui' });
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Tolak Izin"
                    variant="danger"
                    disabled={processingId === item.id}
                    onPress={() => {
                      setErrorPesan(null);
                      setTargetModal({ izin: item, keputusan: 'ditolak' });
                    }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.processedRow}>
                <Text style={styles.processedText}>
                  Keputusan telah dikunci ({badge.teks})
                  {item.diprosesOleh ? ` oleh ${item.diprosesOleh}` : ''}.
                </Text>
              </View>
            )}
          </View>
        );
      })}

      <ConfirmModal
        visible={targetModal !== null}
        onClose={() => setTargetModal(null)}
        ikon={targetModal?.keputusan === 'disetujui' ? 'centang' : 'kunci'}
        tone={targetModal?.keputusan === 'disetujui' ? 'success' : 'danger'}
        title={
          targetModal?.keputusan === 'disetujui'
            ? 'Setujui Pengajuan Izin?'
            : 'Tolak Pengajuan Izin?'
        }
        message={
          targetModal
            ? `Kamu akan ${
                targetModal.keputusan === 'disetujui' ? 'menyetujui' : 'menolak'
              } permohonan izin dari ${targetModal.izin.namaPraktikan} (${targetModal.izin.nimPraktikan}). Keputusan yang disimpan tidak dapat diubah kembali.`
            : ''
        }
        actions={
          <>
            <Button
              label={
                processingId
                  ? 'Menyimpan...'
                  : targetModal?.keputusan === 'disetujui'
                  ? 'Ya, Setujui Izin'
                  : 'Ya, Tolak Izin'
              }
              variant={targetModal?.keputusan === 'disetujui' ? 'success' : 'danger'}
              disabled={!!processingId}
              onPress={eksekusiKeputusan}
            />
            <Button label="Batal" variant="ghost" onPress={() => setTargetModal(null)} />
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  errBox: {
    backgroundColor: W.redSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: W.red,
  },
  errText: { color: W.red, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: W.bg,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: W.line,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  nama: { fontSize: 15, fontWeight: '800', color: W.text },
  nim: { fontSize: 12, color: W.sub, marginTop: 1 },
  waktu: { fontSize: 11, color: W.sub, marginTop: 2 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  alasanBox: {
    backgroundColor: W.card,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: W.line,
  },
  alasanLabel: { fontSize: 10, fontWeight: '800', color: W.sub, letterSpacing: 0.5 },
  alasanText: { fontSize: 13, color: W.text, lineHeight: 19 },
  aiBox: {
    backgroundColor: W.cardAlt,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiTitle: { fontSize: 10, fontWeight: '800', color: W.blue, letterSpacing: 0.5 },
  aiPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  aiPillText: { fontSize: 10, fontWeight: '800' },
  aiDesc: { fontSize: 12, color: W.text, lineHeight: 18 },
  aiMeta: { fontSize: 11, color: W.sub },
  actions: { flexDirection: 'row', gap: 10 },
  processedRow: {
    backgroundColor: W.card,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  processedText: { fontSize: 12, fontWeight: '700', color: W.sub },
});
