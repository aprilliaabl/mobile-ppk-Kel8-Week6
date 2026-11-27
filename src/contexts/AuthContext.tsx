import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { auth, COLLECTIONS, db } from '../config/firebase';
import { hapusCacheSesi } from '../constants/cacheSesi';
import { bersihkanIzinLokal } from '../constants/izinStore';
import { bersihkanPresensiLokal } from '../constants/presensiStore';
import type { Anggota } from '../constants/types';
import { hapusTokenFCM } from '../services/notificationService';

export type UserRole = 'asisten' | 'praktikan';

export interface CurrentUser {
  uid: string;
  nama: string;
  email: string;
  /** Satu akun dapat memiliki kedua peran (mis. asprak di satu lab, praktikan di lab lain). */
  roles: UserRole[];
  nim?: string;
  kelas?: string;
}

interface AuthContextValue {
  currentUser: CurrentUser | null;
  loading: boolean;
  /** Peran yang sedang dipakai. null = pengguna punya dua peran dan belum memilih. */
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole | null) => void;
  /** Keanggotaan laboratorium milik pengguna (real-time). */
  keanggotaan: Anggota[];
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  loading: true,
  activeRole: null,
  setActiveRole: () => {},
  keanggotaan: [],
  logout: async () => {},
});

const KUNCI_ROLE = 'ppk.activeRole';

/** Membaca peran dari dokumen profil. Mendukung dokumen lama yang hanya punya field `role`. */
export function bacaRoles(data: Record<string, unknown>): UserRole[] {
  const valid = (r: unknown): r is UserRole => r === 'asisten' || r === 'praktikan';
  const daftar = Array.isArray(data.roles) ? data.roles.filter(valid) : [];
  if (daftar.length > 0) return Array.from(new Set(daftar));
  return valid(data.role) ? [data.role] : [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pilihan, setPilihan] = useState<UserRole | null>(null);
  const [keanggotaan, setKeanggotaan] = useState<Anggota[]>([]);

  // Pantau status login dan profil.
  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const firebaseAuth = auth;
    const firestore = db;
    let mounted = true;
    let stopProfil: (() => void) | undefined;

    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopProfil?.();
      stopProfil = undefined;

      if (!user) {
        if (mounted) {
          setCurrentUser(null);
          setKeanggotaan([]);
          setLoading(false);
        }
        return;
      }
      if (mounted) setLoading(true);

      stopProfil = onSnapshot(
        doc(firestore, COLLECTIONS.USERS, user.uid),
        (snap) => {
          if (!mounted) return;
          // Profil belum ada: registrasi mungkin masih menulis dokumen. Tunggu.
          if (!snap.exists()) {
            setCurrentUser(null);
            setLoading(false);
            return;
          }
          const data = snap.data();
          const roles = bacaRoles(data);
          if (data.accountStatus !== 'active' || roles.length === 0) {
            setCurrentUser(null);
            setLoading(false);
            void signOut(firebaseAuth).catch(() => {});
            return;
          }
          setCurrentUser({
            uid: user.uid,
            nama: typeof data.nama === 'string' ? data.nama : user.displayName ?? '',
            email: typeof data.email === 'string' ? data.email : user.email ?? '',
            roles,
            ...(typeof data.nim === 'string' && data.nim ? { nim: data.nim } : {}),
            ...(typeof data.kelas === 'string' && data.kelas ? { kelas: data.kelas } : {}),
          });
          setLoading(false);
        },
        (error) => {
          console.error('[AuthContext] Gagal memantau profil:', error);
          if (mounted) {
            setCurrentUser(null);
            setLoading(false);
          }
        }
      );
    });

    return () => {
      mounted = false;
      stopProfil?.();
      stopAuth();
    };
  }, []);

  // Pulihkan peran terakhir yang dipilih untuk akun ini.
  const uid = currentUser?.uid;
  useEffect(() => {
    if (!uid) {
      setPilihan(null);
      return;
    }
    let batal = false;
    AsyncStorage.getItem(`${KUNCI_ROLE}.${uid}`)
      .then((v) => {
        if (!batal && (v === 'asisten' || v === 'praktikan')) setPilihan(v);
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [uid]);

  // Pantau keanggotaan laboratorium milik pengguna.
  useEffect(() => {
    if (!uid || !db) {
      setKeanggotaan([]);
      return;
    }
    const q = query(collection(db, COLLECTIONS.ANGGOTA), where('userId', '==', uid));
    return onSnapshot(
      q,
      (snap) =>
        setKeanggotaan(
          snap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              userId: String(x.userId ?? ''),
              laboratoriumId: String(x.laboratoriumId ?? ''),
              nim: String(x.nim ?? ''),
              nama: String(x.nama ?? ''),
              kelas: String(x.kelas ?? ''),
              role: x.role === 'asisten' ? 'asisten' : 'praktikan',
            } as Anggota;
          })
        ),
      (e) => console.warn('[AuthContext] Gagal memantau keanggotaan:', e)
    );
  }, [uid]);

  const activeRole: UserRole | null = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.roles.length === 1) return currentUser.roles[0];
    return pilihan && currentUser.roles.includes(pilihan) ? pilihan : null;
  }, [currentUser, pilihan]);

  const setActiveRole = useCallback(
    (role: UserRole | null) => {
      setPilihan(role);
      if (uid) {
        const kunci = `${KUNCI_ROLE}.${uid}`;
        (role ? AsyncStorage.setItem(kunci, role) : AsyncStorage.removeItem(kunci)).catch(() => {});
      }
    },
    [uid]
  );

  const logout = useCallback(async () => {
    const uidLama = auth?.currentUser?.uid;
    try {
      // Token dihapus saat masih login agar perangkat ini tidak menerima notifikasi akun lama.
      if (uidLama) await hapusTokenFCM(uidLama);
    } catch (e) {
      console.warn('[Auth] Token FCM tidak dapat dihapus:', e);
    }
    try {
      if (auth) await signOut(auth);
    } finally {
      await hapusCacheSesi();
      bersihkanPresensiLokal();
      bersihkanIzinLokal();
      setPilihan(null);
      setKeanggotaan([]);
    }
  }, []);

  const value = useMemo(
    () => ({ currentUser, loading, activeRole, setActiveRole, keanggotaan, logout }),
    [currentUser, loading, activeRole, setActiveRole, keanggotaan, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
