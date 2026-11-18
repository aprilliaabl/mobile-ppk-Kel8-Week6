
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

import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from 'firebase/auth';

import {
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import {
  auth,
  db,
  isFirebaseConfigured,
  COLLECTIONS,
} from '../config/firebase';

type Role = 'praktikan' | 'asisten';

export default function Register() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const namaBersih = nama.trim();
    const emailBersih = email.trim().toLowerCase();

    if (!namaBersih || !emailBersih || !password || !role) {
      Alert.alert('Peringatan', 'Semua kolom wajib diisi.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(emailBersih)) {
      Alert.alert('Peringatan', 'Format email tidak valid.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Peringatan',
        'Password minimal 6 karakter.'
      );
      return;
    }

    if (!isFirebaseConfigured || !auth || !db) {
      Alert.alert(
        'Konfigurasi Firebase',
        'Firebase belum dikonfigurasi dengan benar. Periksa file .env.'
      );
      return;
    }

    let createdUser = null;

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailBersih,
        password
      );

      createdUser = userCredential.user;

      const isAsistenRequest = role === 'asisten';

      await setDoc(
        doc(db, COLLECTIONS.USERS, createdUser.uid),
        {
          uid: createdUser.uid,
          nama: namaBersih,
          email: emailBersih,

          // Hak akses awal selalu praktikan.
          role: 'praktikan',

          // Peran yang dipilih saat registrasi.
          requestedRole: role,

          // Permohonan asisten harus disetujui terlebih dahulu.
          accountStatus: isAsistenRequest ? 'pending' : 'active',

          createdAt: serverTimestamp(),
        }
      );

      if (isAsistenRequest) {
        // Akun pending tidak dibiarkan masuk ke aplikasi.
        await signOut(auth);

        Alert.alert(
          'Permohonan Terkirim',
          'Akun berhasil dibuat. Permohonan sebagai Asisten menunggu persetujuan administrator.'
        );
      } else {
        Alert.alert(
          'Registrasi Berhasil',
          `Selamat datang, ${namaBersih}! Akun Praktikan kamu berhasil dibuat.`
        );
      }

      setNama('');
      setEmail('');
      setPassword('');
      setRole(null);

    } catch (error: unknown) {
      console.error('Registration error:', error);

      // Jika profil gagal disimpan, hapus akun Auth yang baru dibuat
      // agar tidak meninggalkan akun tanpa dokumen profil.
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (rollbackError) {
          console.error(
            'Gagal membersihkan akun setelah registrasi:',
            rollbackError
          );

          try {
            await signOut(auth);
          } catch (signOutError) {
            console.error('Gagal sign out:', signOutError);
          }
        }
      }

      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : '';

      let pesan = 'Terjadi kesalahan. Silakan coba kembali.';

      switch (errorCode) {
        case 'auth/email-already-in-use':
          pesan = 'Email sudah terdaftar. Silakan gunakan email lain.';
          break;

        case 'auth/invalid-email':
          pesan = 'Format email tidak valid.';
          break;

        case 'auth/weak-password':
          pesan = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
          break;

        case 'auth/operation-not-allowed':
          pesan = 'Registrasi email/password belum diaktifkan di Firebase.';
          break;

        case 'auth/network-request-failed':
          pesan = 'Koneksi internet bermasalah. Periksa jaringan kamu.';
          break;

        case 'permission-denied':
        case 'firestore/permission-denied':
          pesan = 'Profil gagal disimpan karena izin Firestore. Periksa Security Rules.';
          break;
      }

      Alert.alert('Registrasi Gagal', pesan);

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buat Akun</Text>

      <Text style={styles.subtitle}>
        Daftarkan akun untuk menggunakan Presensi Praktikum
      </Text>

      <Text style={styles.label}>Nama Lengkap</Text>
      <TextInput
        style={styles.input}
        placeholder="Masukkan nama lengkap"
        value={nama}
        onChangeText={setNama}
        autoCapitalize="words"
        editable={!loading}
      />

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
        placeholder="Minimal 6 karakter"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <Text style={styles.label}>Pilih Peran</Text>

      <View style={styles.roleContainer}>
        {(['praktikan', 'asisten'] as const).map((item) => (
          <Pressable
            key={item}
            disabled={loading}
            style={[
              styles.roleButton,
              role === item && styles.roleSelected,
            ]}
            onPress={() => setRole(item)}
          >
            <Text
              style={[
                styles.roleText,
                role === item && styles.roleTextSelected,
              ]}
            >
              {item === 'praktikan' ? 'Praktikan' : 'Asisten'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[
          styles.submitButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>Daftar</Text>
        )}
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
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  roleSelected: {
    backgroundColor: '#3730A3',
    borderColor: '#3730A3',
  },
  roleText: {
    color: '#374151',
    fontWeight: '600',
  },
  roleTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#3730A3',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
