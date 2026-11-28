import { Link, Redirect } from 'expo-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthShell, FieldInput, KotakGalat } from '../components/AuthShell';
import { Button } from '../components/Button';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { W } from '../constants/warna';
import { useAuth } from '../contexts/AuthContext';
import { pesanAuth } from '../constants/pesanAuth';

export default function Login() {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Setelah login berhasil dan profil termuat, halaman awal menentukan tujuan sesuai peran.
  if (currentUser) return <Redirect href="/" />;

  const validasi = (): string | null => {
    if (!email.trim() || !password) return 'Email dan password wajib diisi.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Format email tidak valid.';
    if (!isFirebaseConfigured || !auth) return 'Firebase belum dikonfigurasi. Periksa file .env.';
    return null;
  };

  const masuk = async () => {
    setInfo(null);
    const err = validasi();
    if (err) return setGalat(err);
    setGalat(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth!, email.trim().toLowerCase(), password);
      // AuthContext memuat profil; Redirect di atas menangani perpindahan halaman.
    } catch (e) {
      setGalat(pesanAuth(e));
    } finally {
      setLoading(false);
    }
  };

  const lupaPassword = async () => {
    setInfo(null);
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return setGalat('Isi email yang valid dulu, lalu ketuk "Lupa password?".');
    }
    if (!auth) return setGalat('Firebase belum dikonfigurasi. Periksa file .env.');
    setGalat(null);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setInfo('Jika email terdaftar, tautan untuk mengatur ulang password sudah dikirim.');
    } catch (e) {
      setGalat(pesanAuth(e));
    }
  };

  return (
    <AuthShell judul="Selamat Datang" subjudul="Masuk dengan akun praktikum kamu">
      {!!galat && <KotakGalat pesan={galat} />}
      {!!info && (
        <View style={styles.info}>
          <Text style={styles.infoText}>{info}</Text>
        </View>
      )}
      <FieldInput label="Email" value={email} onChangeText={setEmail} placeholder="nama@students.undip.ac.id" keyboardType="email-address" editable={!loading} />
      <FieldInput label="Password" value={password} onChangeText={setPassword} placeholder="Password" secure editable={!loading} />
      <Pressable onPress={lupaPassword} disabled={loading} accessibilityRole="button" style={{ alignSelf: 'flex-end' }}>
        <Text style={styles.link}>Lupa password?</Text>
      </Pressable>
      <Button label={loading ? 'Memproses...' : 'Masuk'} onPress={masuk} disabled={loading} />
      <View style={styles.baris}>
        <Text style={styles.sub}>Belum punya akun? </Text>
        <Link href="/register" asChild>
          <Pressable disabled={loading}>
            <Text style={styles.link}>Daftar di sini</Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  baris: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  sub: { color: W.sub, fontSize: 14 },
  link: { color: W.blue, fontWeight: '700', fontSize: 14 },
  info: { backgroundColor: W.greenSoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: W.green },
  infoText: { color: W.green, fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
