
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import {
  auth,
  db,
  isFirebaseConfigured,
  COLLECTIONS,
} from '../config/firebase';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const emailBersih = email.trim().toLowerCase();

    if (!emailBersih || !password) {
      Alert.alert('Peringatan', 'Email dan password wajib diisi.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(emailBersih)) {
      Alert.alert('Peringatan', 'Format email tidak valid.');
      return;
    }

    if (!isFirebaseConfigured || !auth || !db) {
      Alert.alert(
        'Konfigurasi Firebase',
        'Firebase belum dikonfigurasi dengan benar. Periksa file .env.'
      );
      return;
    }

    let isAuthenticated = false;

    try {
      setLoading(true);

      // 1. Autentikasi menggunakan Firebase Authentication.
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailBersih,
        password
      );

      const user = userCredential.user;
      isAuthenticated = true;

      // 2. Mengambil profil pengguna dari Cloud Firestore.
      const userDoc = await getDoc(
        doc(db, COLLECTIONS.USERS, user.uid)
      );

      if (!userDoc.exists()) {
        await signOut(auth);
        isAuthenticated = false;

        Alert.alert(
          'Login Gagal',
          'Profil pengguna tidak ditemukan. Silakan hubungi administrator.'
        );
        return;
      }

      const userData = userDoc.data();

      // 3. Memeriksa status akun sebelum memberikan akses.
      if (userData.accountStatus !== 'active') {
        await signOut(auth);
        isAuthenticated = false;

        if (userData.accountStatus === 'pending') {
          Alert.alert(
            'Menunggu Persetujuan',
            'Permohonan akun kamu masih menunggu persetujuan administrator.'
          );
        } else {
          Alert.alert(
            'Akses Ditolak',
            'Status akun tidak valid atau belum diaktifkan. Hubungi administrator.'
          );
        }

        return;
      }

      // 4. Mengarahkan pengguna berdasarkan role yang telah disetujui.
      if (userData.role === 'asisten') {
        const { setCurrentUser } = await import('../constants/dummy');
        setCurrentUser({
          id: user.uid,
          nama: userData.nama || user.email || 'Asisten',
          role: 'asisten',
        });
        router.replace('/asisten/(tabs)/beranda' as never);
      } else if (userData.role === 'praktikan') {
        const { setCurrentUser } = await import('../constants/dummy');
        setCurrentUser({
          id: user.uid,
          nama: userData.nama || user.email || 'Praktikan',
          nim: userData.nim || '22/001',
          kelas: userData.kelas || 'IF-2B',
          role: 'praktikan',
        });
        router.replace('/praktikan/(tabs)/beranda' as never);
      } else {
        await signOut(auth);
        isAuthenticated = false;

        Alert.alert(
          'Login Gagal',
          'Role pengguna tidak valid. Hubungi administrator.'
        );
      }

    } catch (error: unknown) {
      console.error('Login error:', error);

      // Pastikan sesi tidak tertinggal jika pemeriksaan profil gagal.
      if (isAuthenticated) {
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error('Gagal mengakhiri sesi:', signOutError);
        }
      }

      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : '';

      let pesan = 'Terjadi kesalahan. Silakan coba kembali.';

      switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          pesan = 'Email atau password salah.';
          break;

        case 'auth/invalid-email':
          pesan = 'Format email tidak valid.';
          break;

        case 'auth/user-disabled':
          pesan = 'Akun ini telah dinonaktifkan.';
          break;

        case 'auth/network-request-failed':
          pesan = 'Koneksi internet bermasalah. Periksa jaringan kamu.';
          break;

        case 'permission-denied':
        case 'firestore/permission-denied':
          pesan = 'Tidak memiliki izin untuk mengakses profil pengguna.';
          break;
      }

      Alert.alert('Login Gagal', pesan);

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selamat Datang</Text>

      <Text style={styles.subtitle}>
        Masuk ke akun Presensi Praktikum kamu
      </Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Masukkan email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Masukkan password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <Pressable
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Masuk</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.registerLink}
        onPress={() => router.push('/register' as never)}
        disabled={loading}
      >
        <Text style={styles.registerText}>
          Belum punya akun? Daftar di sini
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#3730A3',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#3730A3',
    fontWeight: '600',
  },
});
