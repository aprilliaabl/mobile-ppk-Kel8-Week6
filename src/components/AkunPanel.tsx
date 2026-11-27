import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { HeaderCard } from './HeaderCard';
import { inisial } from '../constants/format';
import { useLaboratoriumList } from '../constants/laboratoriumStore';
import { W, warnaAvatar } from '../constants/warna';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentUser } from '../hooks/use-current-user';

/** Tab "Akun": identitas, keanggotaan laboratorium, ganti peran (bila punya dua), dan keluar. */
export function AkunPanel({ role }: { role: 'asisten' | 'praktikan' }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser(role);
  const { currentUser, keanggotaan, setActiveRole, logout } = useAuth();
  const labs = useLaboratoriumList();
  const [keluar, setKeluar] = useState(false);

  const punyaDuaPeran = (currentUser?.roles.length ?? 0) > 1;
  const milikPeran = keanggotaan.filter((a) => a.role === role);

  const handleKeluar = async () => {
    setKeluar(true);
    try {
      await logout();
    } finally {
      setKeluar(false);
      router.replace('/');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}
    >
      <View style={styles.inner}>
        <HeaderCard badge={role === 'asisten' ? 'ASISTEN' : 'PRAKTIKAN'} title="Akun" subtitle="Identitas dan pengaturan akun">
          <View style={styles.profil}>
            <View style={[styles.avatar, { backgroundColor: warnaAvatar(user.id || 'x') }]}>
              <Text style={styles.avatarText}>{inisial(user.nama || '?')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nama}>{user.nama}</Text>
              <Text style={styles.sub}>{user.email}</Text>
              <Text style={styles.sub}>
                {user.nim ? `NIM ${user.nim}` : 'NIM belum diisi'}
                {role === 'praktikan' && user.kelasList?.length ? ` • ${user.kelasList.join(', ')}` : ''}
              </Text>
            </View>
          </View>
        </HeaderCard>

        <View style={styles.card}>
          <Text style={styles.judul}>{role === 'asisten' ? 'Laboratorium yang saya asuh' : 'Laboratorium saya'}</Text>
          {milikPeran.length === 0 ? (
            <Text style={styles.desc}>
              {role === 'asisten'
                ? 'Kamu belum ditempatkan di laboratorium tertentu. Sebagai asisten kamu tetap dapat mengelola semua laboratorium.'
                : 'Kamu belum dimasukkan ke laboratorium mana pun. Hubungi aslab dengan menyebutkan NIM-mu.'}
            </Text>
          ) : (
            milikPeran.map((a) => {
              const lab = labs.find((l) => l.id === a.laboratoriumId);
              return (
                <View key={a.id} style={styles.baris}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.labNama}>{lab?.nama ?? a.laboratoriumId}</Text>
                    <Text style={styles.sub}>{lab?.mataKuliah ?? lab?.gedung ?? ''}{a.kelas ? ` • Kelas ${a.kelas}` : ''}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {punyaDuaPeran && (
          <View style={styles.card}>
            <Text style={styles.judul}>Ganti peran</Text>
            <Text style={styles.desc}>
              Akunmu terdaftar sebagai asisten dan praktikan. Sekarang kamu memakai peran {role === 'asisten' ? 'Asisten' : 'Praktikan'}.
            </Text>
            <Button
              label={role === 'asisten' ? 'Pindah ke peran Praktikan' : 'Pindah ke peran Asisten'}
              variant="outline"
              onPress={() => {
                setActiveRole(role === 'asisten' ? 'praktikan' : 'asisten');
                router.replace('/');
              }}
            />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.judul}>Keluar</Text>
          <Text style={styles.desc}>Keluar dari akun ini. Notifikasi untuk akun ini di perangkat ini akan dihentikan.</Text>
          <Button label={keluar ? 'Keluar...' : 'Keluar dari akun'} variant="danger" onPress={handleKeluar} disabled={keluar} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, flexGrow: 1 },
  inner: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 14 },
  profil: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, backgroundColor: W.cardAlt, borderRadius: 14, padding: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  nama: { fontSize: 17, fontWeight: '800', color: W.text },
  sub: { fontSize: 13, color: W.sub, marginTop: 2 },
  card: { backgroundColor: W.card, borderRadius: 20, padding: 18, gap: 12, borderWidth: 1, borderColor: W.line },
  judul: { fontSize: 16, fontWeight: '800', color: W.text },
  desc: { fontSize: 13, color: W.sub, lineHeight: 19 },
  baris: { flexDirection: 'row', alignItems: 'center', backgroundColor: W.cardAlt, borderRadius: 12, padding: 12 },
  labNama: { fontSize: 14, fontWeight: '700', color: W.text },
});
