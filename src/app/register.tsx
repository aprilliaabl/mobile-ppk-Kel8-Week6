import { Link, Redirect } from 'expo-router';
import { createUserWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthShell, FieldInput, KotakGalat, PilihanChip } from '../components/AuthShell';
import { Button } from '../components/Button';
import { auth, COLLECTIONS, db, isFirebaseConfigured } from '../config/firebase';
import { pesanAuth } from '../constants/pesanAuth';
import { W } from '../constants/warna';
import { useAuth, type UserRole } from '../contexts/AuthContext';

type Errors = Partial<Record<'nama' | 'nim' | 'email' | 'password' | 'konfirmasi' | 'peran' | 'kode', string>>;

/** Kunci dokumen indeks NIM: seragam huruf kecil tanpa karakter yang tidak boleh ada di ID dokumen. */
const kunciNim = (nim: string) => nim.trim().toLowerCase().replace(/\//g, '-');

export default function Register() {
  const { currentUser } = useAuth();
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [kelas, setKelas] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [peran, setPeran] = useState<UserRole[]>(['praktikan']);
  const [kode, setKode] = useState('');
  const [err, setErr] = useState<Errors>({});
  const [galat, setGalat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (currentUser) return <Redirect href="/" />;

  const togglePeran = (p: UserRole) =>
    setPeran((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const validasi = (): Errors => {
    const e: Errors = {};
    if (nama.trim().length < 3) e.nama = 'Nama minimal 3 karakter.';
    if (!/^[\w./-]{5,24}$/.test(nim.trim())) e.nim = 'NIM tidak valid (5-24 karakter, tanpa spasi).';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Format email tidak valid.';
    if (password.length < 6) e.password = 'Password minimal 6 karakter.';
    if (konfirmasi !== password) e.konfirmasi = 'Konfirmasi password tidak sama.';
    if (peran.length === 0) e.peran = 'Pilih minimal satu peran.';
    if (peran.includes('asisten') && !kode.trim()) e.kode = 'Kode verifikasi asisten wajib diisi.';
    return e;
  };

  const daftar = async () => {
    const e = validasi();
    setErr(e);
    setGalat(null);
    if (Object.keys(e).length > 0) return;
    if (!isFirebaseConfigured || !auth || !db) {
      return setGalat('Firebase belum dikonfigurasi. Periksa file .env.');
    }

    const firestore = db;
    let dibuat: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>['user'] | null = null;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      dibuat = cred.user;

      // Profil dan indeks NIM ditulis atomik. Indeks NIM bersifat create-only, sehingga NIM ganda ditolak server.
      const batch = writeBatch(firestore);
      batch.set(doc(firestore, COLLECTIONS.NIM_INDEX, kunciNim(nim)), {
        uid: cred.user.uid,
        nim: nim.trim(),
        createdAt: serverTimestamp(),
      });
      batch.set(doc(firestore, COLLECTIONS.USERS, cred.user.uid), {
        uid: cred.user.uid,
        nama: nama.trim(),
        nim: nim.trim(),
        email: email.trim().toLowerCase(),
        ...(kelas.trim() ? { kelas: kelas.trim().toUpperCase() } : {}),
        roles: peran,
        accountStatus: 'active',
        ...(peran.includes('asisten') ? { kodeAsisten: kode.trim() } : {}),
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      // Setelah profil tersimpan, AuthContext memuat akun dan Redirect di atas membawa pengguna masuk.
    } catch (error) {
      console.error('Registration error:', error);
      if (dibuat) {
        try {
          await deleteUser(dibuat);
        } catch {
          await signOut(auth).catch(() => {});
        }
      }
      const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
      if (code.includes('permission-denied')) {
        setGalat(
          peran.includes('asisten')
            ? 'Pendaftaran ditolak. Periksa kode verifikasi asisten, dan pastikan NIM belum pernah didaftarkan.'
            : 'Pendaftaran ditolak. NIM ini kemungkinan sudah pernah didaftarkan.'
        );
      } else {
        setGalat(pesanAuth(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell judul="Buat Akun" subjudul="Satu akun untuk semua praktikum kamu">
      {!!galat && <KotakGalat pesan={galat} />}
      <FieldInput label="Nama Lengkap" value={nama} onChangeText={setNama} placeholder="Nama sesuai KRS" autoCapitalize="words" error={err.nama} editable={!loading} />
      <FieldInput label="NIM" value={nim} onChangeText={setNim} placeholder="24060123140001" error={err.nim} editable={!loading} hint="NIM dipakai aslab untuk memasukkanmu ke laboratorium." />
      <FieldInput label="Email" value={email} onChangeText={setEmail} placeholder="nama@students.undip.ac.id" keyboardType="email-address" error={err.email} editable={!loading} />
      <FieldInput label="Password" value={password} onChangeText={setPassword} placeholder="Minimal 6 karakter" secure error={err.password} editable={!loading} />
      <FieldInput label="Ulangi Password" value={konfirmasi} onChangeText={setKonfirmasi} placeholder="Ketik ulang password" secure error={err.konfirmasi} editable={!loading} />

      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Peran (boleh dua-duanya)</Text>
        <View style={styles.chips}>
          <PilihanChip label="Praktikan" aktif={peran.includes('praktikan')} onPress={() => togglePeran('praktikan')} disabled={loading} />
          <PilihanChip label="Asisten" aktif={peran.includes('asisten')} onPress={() => togglePeran('asisten')} disabled={loading} />
        </View>
        {!!err.peran && <Text style={styles.error}>{err.peran}</Text>}
        <Text style={styles.hint}>Pilih keduanya bila kamu praktikan di satu mata kuliah dan asisten di mata kuliah lain.</Text>
      </View>

      {peran.includes('praktikan') && (
        <FieldInput label="Kelas (opsional)" value={kelas} onChangeText={setKelas} placeholder="IF-2B" autoCapitalize="characters" editable={!loading} hint="Bisa dikosongkan; aslab dapat mengisinya saat distribusi laboratorium." />
      )}
      {peran.includes('asisten') && (
        <FieldInput label="Kode Verifikasi Asisten" value={kode} onChangeText={setKode} placeholder="Kode dari aslab" secure error={err.kode} editable={!loading} hint="Minta kode ini ke koordinator aslab. Tanpa kode yang benar, pendaftaran asisten ditolak." />
      )}

      <Button label={loading ? 'Mendaftarkan...' : 'Daftar'} onPress={daftar} disabled={loading} />
      <View style={styles.baris}>
        <Text style={styles.sub}>Sudah punya akun? </Text>
        <Link href="/login" asChild>
          <Pressable disabled={loading}>
            <Text style={styles.link}>Masuk di sini</Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: W.text },
  chips: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  error: { fontSize: 12, color: W.red, fontWeight: '600' },
  hint: { fontSize: 12, color: W.sub, lineHeight: 17 },
  baris: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  sub: { color: W.sub, fontSize: 14 },
  link: { color: W.blue, fontWeight: '700', fontSize: 14 },
});
