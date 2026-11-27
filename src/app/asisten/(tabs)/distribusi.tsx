import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '../../../components/BottomSheet';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { HeaderCard, StatBox } from '../../../components/HeaderCard';
import { LoadingState } from '../../../components/StateView';
import { unduhTemplat, pilihFileCSV } from '../../../constants/csvFile';
import {
  bacaBarisImpor,
  buatLabBulk,
  keluarkanAnggota,
  KOLOM,
  muatSemuaUser,
  pesanGalat,
  pindahkanAnggota,
  tambahAnggota,
  tambahAnggotaBulk,
  validasiSemua,
  type HasilBaris,
  type ImportRow,
  type JenisImpor,
  type ProfilUser,
} from '../../../constants/laboratoriumDistribution';
import { useLaboratoriumList } from '../../../constants/laboratoriumStore';
import type { Anggota, Laboratorium, Role } from '../../../constants/types';
import { MAX_W, W } from '../../../constants/warna';
import { useSemuaAnggota } from '../../../hooks/use-anggota';

type Mode = 'anggota' | 'impor';
const JENIS: { key: JenisImpor; label: string }[] = [
  { key: 'laboratorium', label: 'Laboratorium' },
  { key: 'praktikan', label: 'Praktikan' },
  { key: 'asprak', label: 'Asprak' },
];

/** FR-03 s.d. FR-06: distribusi anggota ke laboratorium dan impor massal (CSV) dengan tinjauan per baris. */
export default function DistribusiAsisten() {
  const insets = useSafeAreaInsets();
  const labs = useLaboratoriumList();
  const { anggota, loading, error } = useSemuaAnggota();
  const [mode, setMode] = useState<Mode>('anggota');
  const [users, setUsers] = useState<ProfilUser[]>([]);
  const [errUsers, setErrUsers] = useState<string | null>(null);

  const muatUser = useCallback(async () => {
    try {
      setUsers(await muatSemuaUser());
      setErrUsers(null);
    } catch (e) {
      setErrUsers(pesanGalat(e));
    }
  }, []);
  useEffect(() => {
    void muatUser();
  }, [muatUser]);

  const jmlPraktikan = anggota.filter((a) => a.role === 'praktikan').length;
  const jmlAsprak = anggota.filter((a) => a.role === 'asisten').length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>
        <HeaderCard badge="ASISTEN" title="Anggota Laboratorium" subtitle="Masukkan, pindahkan, dan impor praktikan serta asprak">
          <View style={styles.stats}>
            <StatBox label="Laboratorium" value={labs.length} />
            <StatBox label="Praktikan" value={jmlPraktikan} color={W.green} />
            <StatBox label="Asprak" value={jmlAsprak} color={W.blue} />
          </View>
          <View style={styles.chips}>
            <Chip label="Daftar anggota" aktif={mode === 'anggota'} onPress={() => setMode('anggota')} />
            <Chip label="Impor CSV" aktif={mode === 'impor'} onPress={() => setMode('impor')} />
          </View>
        </HeaderCard>

        {!!errUsers && (
          <View style={styles.peringatan}>
            <Text style={styles.peringatanText}>{errUsers}</Text>
            <Button label="Muat ulang daftar akun" variant="outline" onPress={() => void muatUser()} />
          </View>
        )}

        {labs.length === 0 ? (
          <View style={styles.card}>
            <EmptyState ikon="lab" judul="Belum ada laboratorium" deskripsi="Buat laboratorium dulu di tab Lab, atau impor laboratorium lewat tab ini (Impor CSV → Laboratorium)." />
            {mode === 'anggota' && <Button label="Impor laboratorium dari CSV" onPress={() => setMode('impor')} />}
          </View>
        ) : null}

        {mode === 'anggota' ? (
          loading ? (
            <LoadingState teks="Memuat anggota..." />
          ) : error ? (
            <View style={styles.peringatan}><Text style={styles.peringatanText}>{error}</Text></View>
          ) : (
            <PanelAnggota labs={labs} anggota={anggota} users={users} />
          )
        ) : (
          <PanelImpor labs={labs} anggota={anggota} users={users} onSelesai={muatUser} />
        )}
      </View>
    </ScrollView>
  );
}

/* ====================== DAFTAR ANGGOTA (FR-04) ====================== */

function PanelAnggota({ labs, anggota, users }: { labs: Laboratorium[]; anggota: Anggota[]; users: ProfilUser[] }) {
  const [labId, setLabId] = useState<string>('semua');
  const [role, setRole] = useState<'semua' | Role>('semua');
  const [cari, setCari] = useState('');
  const [tambahOpen, setTambahOpen] = useState(false);
  const [pindah, setPindah] = useState<Anggota | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  const q = cari.trim().toLowerCase();
  const tampil = useMemo(
    () =>
      anggota
        .filter((a) => (labId === 'semua' || a.laboratoriumId === labId) && (role === 'semua' || a.role === role))
        .filter((a) => !q || a.nama.toLowerCase().includes(q) || a.nim.toLowerCase().includes(q))
        .sort((a, b) => a.nama.localeCompare(b.nama)),
    [anggota, labId, role, q]
  );

  const keluarkan = async (a: Anggota) => {
    try {
      await keluarkanAnggota(a);
      setPesan(`${a.nama} dikeluarkan dari laboratorium.`);
    } catch (e) {
      setPesan(pesanGalat(e));
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.judul}>Anggota</Text>
          <Text style={styles.sub}>{tampil.length} anggota ditampilkan</Text>
        </View>
        <Button label="+ Tambah" onPress={() => setTambahOpen(true)} disabled={labs.length === 0} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Semua lab" aktif={labId === 'semua'} onPress={() => setLabId('semua')} />
        {labs.map((l) => (
          <Chip key={l.id} label={l.kode || l.nama} aktif={labId === l.id} onPress={() => setLabId(l.id)} />
        ))}
      </ScrollView>
      <View style={styles.chips}>
        <Chip label="Semua peran" aktif={role === 'semua'} onPress={() => setRole('semua')} />
        <Chip label="Praktikan" aktif={role === 'praktikan'} onPress={() => setRole('praktikan')} />
        <Chip label="Asprak" aktif={role === 'asisten'} onPress={() => setRole('asisten')} />
      </View>
      <TextInput value={cari} onChangeText={setCari} placeholder="Cari nama atau NIM" placeholderTextColor={W.sub} style={styles.input} />

      {!!pesan && <Text style={styles.info}>{pesan}</Text>}

      {tampil.length === 0 ? (
        <EmptyState ikon="grup" judul="Belum ada anggota" deskripsi="Tambahkan anggota satu per satu atau impor dari CSV." />
      ) : (
        tampil.map((a) => {
          const lab = labs.find((l) => l.id === a.laboratoriumId);
          return (
            <View key={a.id} style={styles.baris}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nama}>{a.nama}</Text>
                <Text style={styles.sub}>
                  {a.nim} • {a.role === 'asisten' ? 'Asprak' : 'Praktikan'}
                  {a.kelas ? ` • ${a.kelas}` : ''}
                </Text>
                <Text style={styles.sub}>{lab?.nama ?? `Lab tidak dikenal (${a.laboratoriumId})`}</Text>
              </View>
              <View style={{ gap: 6 }}>
                <MiniTombol label="Pindah" onPress={() => setPindah(a)} />
                <MiniTombol label="Keluarkan" bahaya onPress={() => void keluarkan(a)} />
              </View>
            </View>
          );
        })
      )}

      <FormTambah visible={tambahOpen} onClose={() => setTambahOpen(false)} labs={labs} anggota={anggota} users={users} />
      <FormPindah anggota={pindah} onClose={() => setPindah(null)} labs={labs} semua={anggota} />
    </View>
  );
}

function FormTambah({ visible, onClose, labs, anggota, users }: { visible: boolean; onClose: () => void; labs: Laboratorium[]; anggota: Anggota[]; users: ProfilUser[] }) {
  const [cari, setCari] = useState('');
  const [user, setUser] = useState<ProfilUser | null>(null);
  const [labId, setLabId] = useState('');
  const [role, setRole] = useState<Role>('praktikan');
  const [kelas, setKelas] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  useEffect(() => {
    if (visible) {
      setCari('');
      setUser(null);
      setLabId(labs[0]?.id ?? '');
      setRole('praktikan');
      setKelas('');
      setGalat(null);
    }
  }, [visible, labs]);

  const q = cari.trim().toLowerCase();
  const hasil = q.length < 2 ? [] : users.filter((u) => u.nim.toLowerCase().includes(q) || u.nama.toLowerCase().includes(q)).slice(0, 5);

  const simpan = async () => {
    const lab = labs.find((l) => l.id === labId);
    if (!user) return setGalat('Pilih akun terlebih dahulu.');
    if (!lab) return setGalat('Pilih laboratorium.');
    setProses(true);
    setGalat(null);
    try {
      await tambahAnggota({ user, lab, role, kelas }, anggota);
      onClose();
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setProses(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Tambah anggota">
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 520 }} contentContainerStyle={{ gap: 12 }}>
        <Text style={styles.label}>Cari akun (NIM atau nama)</Text>
        <TextInput value={cari} onChangeText={(t) => { setCari(t); setUser(null); }} placeholder="Minimal 2 karakter" placeholderTextColor={W.sub} style={styles.input} autoCapitalize="none" />
        {hasil.map((u) => (
          <Pressable key={u.uid} onPress={() => { setUser(u); setCari(`${u.nim} - ${u.nama}`); }} style={[styles.baris, user?.uid === u.uid && { borderColor: W.blue }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nama}>{u.nama}</Text>
              <Text style={styles.sub}>{u.nim} • {u.roles.map((r) => (r === 'asisten' ? 'asisten' : 'praktikan')).join(' & ')}</Text>
            </View>
          </Pressable>
        ))}
        {q.length >= 2 && hasil.length === 0 && !user && <Text style={styles.sub}>Tidak ada akun yang cocok. Pastikan yang bersangkutan sudah mendaftar.</Text>}

        <Text style={styles.label}>Peran di laboratorium</Text>
        <View style={styles.chips}>
          <Chip label="Praktikan" aktif={role === 'praktikan'} onPress={() => setRole('praktikan')} />
          <Chip label="Asprak" aktif={role === 'asisten'} onPress={() => setRole('asisten')} />
        </View>

        <Text style={styles.label}>Laboratorium</Text>
        <View style={styles.chips}>
          {labs.map((l) => <Chip key={l.id} label={l.kode || l.nama} aktif={labId === l.id} onPress={() => setLabId(l.id)} />)}
        </View>

        <Text style={styles.label}>Kelas {role === 'praktikan' ? '(wajib)' : '(opsional)'}</Text>
        <TextInput value={kelas} onChangeText={setKelas} placeholder="IF-2B" placeholderTextColor={W.sub} style={styles.input} autoCapitalize="characters" />

        {!!galat && <Text style={styles.galat}>{galat}</Text>}
        <Button label={proses ? 'Menyimpan...' : 'Simpan'} onPress={simpan} disabled={proses} />
        <Button label="Batal" variant="ghost" onPress={onClose} />
      </ScrollView>
    </BottomSheet>
  );
}

function FormPindah({ anggota, onClose, labs, semua }: { anggota: Anggota | null; onClose: () => void; labs: Laboratorium[]; semua: Anggota[] }) {
  const [tujuan, setTujuan] = useState('');
  const [kelas, setKelas] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  useEffect(() => {
    if (anggota) {
      setTujuan('');
      setKelas(anggota.kelas);
      setGalat(null);
    }
  }, [anggota]);

  const simpan = async () => {
    const lab = labs.find((l) => l.id === tujuan);
    if (!anggota || !lab) return setGalat('Pilih laboratorium tujuan.');
    setProses(true);
    setGalat(null);
    try {
      await pindahkanAnggota(anggota, lab, kelas, semua);
      onClose();
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setProses(false);
    }
  };

  return (
    <BottomSheet visible={!!anggota} onClose={onClose} title={`Pindahkan ${anggota?.nama ?? ''}`}>
      <Text style={styles.label}>Laboratorium tujuan</Text>
      <View style={styles.chips}>
        {labs.filter((l) => l.id !== anggota?.laboratoriumId).map((l) => <Chip key={l.id} label={l.kode || l.nama} aktif={tujuan === l.id} onPress={() => setTujuan(l.id)} />)}
      </View>
      <Text style={styles.label}>Kelas di laboratorium tujuan</Text>
      <TextInput value={kelas} onChangeText={setKelas} placeholder="IF-2B" placeholderTextColor={W.sub} style={styles.input} autoCapitalize="characters" />
      {!!galat && <Text style={styles.galat}>{galat}</Text>}
      <Button label={proses ? 'Memindahkan...' : 'Pindahkan'} onPress={simpan} disabled={proses} />
      <Button label="Batal" variant="ghost" onPress={onClose} />
    </BottomSheet>
  );
}

/* ====================== IMPOR CSV (FR-03, FR-05, FR-06) ====================== */

function PanelImpor({ labs, anggota, users, onSelesai }: { labs: Laboratorium[]; anggota: Anggota[]; users: ProfilUser[]; onSelesai: () => void }) {
  const [jenis, setJenis] = useState<JenisImpor>('praktikan');
  const [mataKuliah, setMataKuliah] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [namaFile, setNamaFile] = useState<string | null>(null);
  const [edit, setEdit] = useState<ImportRow | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilBaris[] | null>(null);
  const [proses, setProses] = useState(false);

  const konteks = useMemo(() => ({ labs, anggota, users }), [labs, anggota, users]);

  const ganti = (j: JenisImpor) => {
    setJenis(j);
    setRows([]);
    setNamaFile(null);
    setGalat(null);
    setHasil(null);
  };

  const unduh = async () => {
    setGalat(null);
    try {
      await unduhTemplat(jenis);
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  };

  const pilih = async () => {
    setGalat(null);
    setHasil(null);
    try {
      const f = await pilihFileCSV();
      if (!f) return;
      const baris = bacaBarisImpor(f.isi, jenis);
      setRows(validasiSemua(baris, jenis, konteks));
      setNamaFile(f.nama);
    } catch (e) {
      setRows([]);
      setNamaFile(null);
      setGalat(pesanGalat(e));
    }
  };

  const ubahStatus = (id: string, status: ImportRow['status']) =>
    setRows((cur) => cur.map((r) => (r.id === id && (status !== 'accepted' || r.errors.length === 0) ? { ...r, status } : r)));

  const simpanEdit = (baru: ImportRow) => {
    setRows((cur) => validasiSemua(cur.map((r) => (r.id === baru.id ? { ...baru, status: 'review' } : r)), jenis, konteks));
    setEdit(null);
  };

  const terimaSemuaValid = () => setRows((cur) => cur.map((r) => (r.status === 'review' && r.errors.length === 0 ? { ...r, status: 'accepted' } : r)));
  const tolakSemuaError = () => setRows((cur) => cur.map((r) => (r.errors.length > 0 && r.status !== 'rejected' ? { ...r, status: 'rejected' } : r)));

  const diterima = rows.filter((r) => r.status === 'accepted' && r.errors.length === 0).length;
  const bermasalah = rows.filter((r) => r.errors.length > 0 && r.status !== 'rejected').length;

  const simpan = async () => {
    setGalat(null);
    setProses(true);
    try {
      const h = jenis === 'laboratorium' ? await buatLabBulk(rows, mataKuliah) : await tambahAnggotaBulk(rows, jenis, konteks);
      setHasil(h);
      // Baris yang berhasil disimpan dikeluarkan dari daftar tinjauan; yang gagal tetap untuk diperbaiki.
      const berhasil = new Set(h.filter((x) => x.ok).map((x) => x.rowId));
      setRows((cur) => validasiSemua(cur.filter((r) => !berhasil.has(r.id)), jenis, konteks));
      onSelesai();
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setProses(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.judul}>Impor massal</Text>
      <Text style={styles.sub}>Unduh templat, isi, lalu pilih file CSV. Setiap baris dapat ditinjau, diedit, diterima, atau ditolak sebelum disimpan.</Text>

      <View style={styles.chips}>
        {JENIS.map((j) => <Chip key={j.key} label={j.label} aktif={jenis === j.key} onPress={() => ganti(j.key)} />)}
      </View>

      <Button label={`Unduh templat ${JENIS.find((j) => j.key === jenis)!.label}`} variant="outline" onPress={() => void unduh()} />

      {jenis === 'laboratorium' && (
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>Mata kuliah (satu mata kuliah untuk seluruh laboratorium di file)</Text>
          <TextInput value={mataKuliah} onChangeText={setMataKuliah} placeholder="Mis. Basis Data" placeholderTextColor={W.sub} style={styles.input} />
        </View>
      )}

      <Button label={namaFile ? `File: ${namaFile} (ganti)` : 'Pilih file CSV'} onPress={() => void pilih()} />
      {!!galat && <Text style={styles.galat}>{galat}</Text>}

      {rows.length > 0 && (
        <>
          <View style={styles.stats}>
            <StatBox label="Baris" value={rows.length} />
            <StatBox label="Diterima" value={diterima} color={W.green} />
            <StatBox label="Bermasalah" value={bermasalah} color={W.red} />
          </View>
          <View style={styles.chips}>
            <MiniTombol label="Terima semua yang valid" onPress={terimaSemuaValid} />
            <MiniTombol label="Tolak semua yang bermasalah" bahaya onPress={tolakSemuaError} />
          </View>
          {rows.map((r) => (
            <KartuBaris key={r.id} row={r} jenis={jenis} onEdit={() => setEdit(r)} onTerima={() => ubahStatus(r.id, 'accepted')} onTolak={() => ubahStatus(r.id, 'rejected')} onTinjau={() => ubahStatus(r.id, 'review')} />
          ))}
          <Button
            label={proses ? 'Menyimpan...' : `Simpan ${diterima} baris yang diterima`}
            variant="success"
            onPress={() => void simpan()}
            disabled={proses || diterima === 0 || (jenis === 'laboratorium' && !mataKuliah.trim())}
          />
          {jenis === 'laboratorium' && !mataKuliah.trim() && <Text style={styles.sub}>Isi mata kuliah untuk dapat menyimpan.</Text>}
        </>
      )}

      {hasil && (
        <View style={styles.hasil}>
          <Text style={styles.judul}>Hasil penyimpanan</Text>
          <Text style={[styles.sub, { color: W.green }]}>{hasil.filter((h) => h.ok).length} baris berhasil</Text>
          {hasil.filter((h) => !h.ok).map((h) => (
            <Text key={h.rowId} style={styles.galat}>Baris {h.rowId.replace('r', '')}: {h.message}</Text>
          ))}
        </View>
      )}

      <FormEditBaris row={edit} jenis={jenis} onClose={() => setEdit(null)} onSimpan={simpanEdit} />
    </View>
  );
}

function KartuBaris({ row, jenis, onEdit, onTerima, onTolak, onTinjau }: { row: ImportRow; jenis: JenisImpor; onEdit: () => void; onTerima: () => void; onTolak: () => void; onTinjau: () => void }) {
  const warna = row.status === 'accepted' ? W.green : row.status === 'rejected' ? W.red : row.errors.length > 0 ? W.amber : W.blue;
  const label = row.status === 'accepted' ? 'DITERIMA' : row.status === 'rejected' ? 'DITOLAK' : row.errors.length > 0 ? 'PERLU DIPERBAIKI' : 'TINJAU';
  const utama = jenis === 'laboratorium' ? `${row.values.kode || '(kode kosong)'} • ${row.values.nama || '-'}` : `${row.values.nim || '(NIM kosong)'} • ${row.values.nama || '-'}`;
  const ringkas = KOLOM[jenis].filter((k) => !['kode', 'nim', 'nama'].includes(k.key) && row.values[k.key]).map((k) => `${k.label}: ${row.values[k.key]}`).join(' • ');

  return (
    <View style={[styles.baris, { borderColor: warna, flexDirection: 'column', alignItems: 'stretch' }]}>
      <View style={styles.rowTop}>
        <Text style={[styles.nama, { flex: 1 }]}>Baris {row.rowNumber}: {utama}</Text>
        <Text style={[styles.badge, { color: warna, backgroundColor: `${warna}22` }]}>{label}</Text>
      </View>
      {!!ringkas && <Text style={styles.sub}>{ringkas}</Text>}
      {row.errors.map((e) => <Text key={e} style={styles.galat}>• {e}</Text>)}
      {row.warnings.map((e) => <Text key={e} style={styles.peringatanKecil}>• {e}</Text>)}
      <View style={styles.chips}>
        <MiniTombol label="Edit" onPress={onEdit} />
        {row.status !== 'accepted' && <MiniTombol label="Terima" disabled={row.errors.length > 0} onPress={onTerima} />}
        {row.status !== 'rejected' && <MiniTombol label="Tolak" bahaya onPress={onTolak} />}
        {row.status !== 'review' && <MiniTombol label="Tinjau ulang" onPress={onTinjau} />}
      </View>
    </View>
  );
}

function FormEditBaris({ row, jenis, onClose, onSimpan }: { row: ImportRow | null; jenis: JenisImpor; onClose: () => void; onSimpan: (r: ImportRow) => void }) {
  const [nilai, setNilai] = useState<Record<string, string>>({});
  useEffect(() => {
    if (row) setNilai({ ...row.values });
  }, [row]);

  return (
    <BottomSheet visible={!!row} onClose={onClose} title={row ? `Edit baris ${row.rowNumber}` : 'Edit baris'}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 10 }}>
        {KOLOM[jenis].map((k) => (
          <View key={k.key} style={{ gap: 4 }}>
            <Text style={styles.label}>{k.label}{k.wajib ? ' *' : ''}</Text>
            <TextInput value={nilai[k.key] ?? ''} onChangeText={(t) => setNilai((p) => ({ ...p, [k.key]: t }))} placeholderTextColor={W.sub} style={styles.input} autoCapitalize="none" />
          </View>
        ))}
        <Button label="Simpan perubahan" onPress={() => row && onSimpan({ ...row, values: nilai })} />
        <Button label="Batal" variant="ghost" onPress={onClose} />
      </ScrollView>
    </BottomSheet>
  );
}

/* ====================== KOMPONEN KECIL ====================== */

function Chip({ label, aktif, onPress }: { label: string; aktif: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.chip, aktif && styles.chipAktif]}>
      <Text style={[styles.chipText, aktif && { color: '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

function MiniTombol({ label, onPress, bahaya, disabled }: { label: string; onPress: () => void; bahaya?: boolean; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={[styles.mini, bahaya && { backgroundColor: W.redSoft }, disabled && { opacity: 0.4 }]}>
      <Text style={[styles.miniText, bahaya && { color: W.red }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, flexGrow: 1 },
  inner: { width: '100%', maxWidth: MAX_W, alignSelf: 'center', gap: 14 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  card: { backgroundColor: W.card, borderRadius: 20, padding: 18, gap: 12, borderWidth: 1, borderColor: W.line },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  judul: { fontSize: 17, fontWeight: '800', color: W.text },
  sub: { fontSize: 13, color: W.sub, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '700', color: W.text },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: W.cardAlt, borderWidth: 1, borderColor: W.line },
  chipAktif: { backgroundColor: W.blue, borderColor: W.blue },
  chipText: { fontSize: 13, fontWeight: '600', color: W.sub },
  input: { backgroundColor: W.bg, borderWidth: 1.5, borderColor: W.cardAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: W.text },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: W.cardAlt, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'transparent' },
  nama: { fontSize: 14, fontWeight: '700', color: W.text },
  mini: { backgroundColor: W.blueSoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9 },
  miniText: { fontSize: 12, fontWeight: '800', color: W.blue },
  badge: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  galat: { fontSize: 12, color: W.red, fontWeight: '600', lineHeight: 17 },
  peringatanKecil: { fontSize: 12, color: W.amber, lineHeight: 17 },
  info: { fontSize: 13, color: W.green, fontWeight: '600' },
  peringatan: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: 14, padding: 14, gap: 10 },
  peringatanText: { fontSize: 13, color: W.amber, fontWeight: '600', lineHeight: 18 },
  hasil: { backgroundColor: W.cardAlt, borderRadius: 14, padding: 14, gap: 6 },
});
