
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';

import {
  doc,
  onSnapshot,
} from 'firebase/firestore';

import {
  auth,
  COLLECTIONS,
  db,
} from '../config/firebase';

export type UserRole = 'asisten' | 'praktikan';

export interface CurrentUser {
  uid: string;
  nama: string;
  email: string;
  role: UserRole;
  nim?: string;
  kelas?: string;
}

interface AuthContextValue {
  currentUser: CurrentUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  loading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const firebaseAuth = auth;
    const firestore = db;

    let isMounted = true;
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(
      firebaseAuth,
      (firebaseUser) => {
        // Hentikan pemantauan profil pengguna sebelumnya.
        unsubscribeProfile?.();
        unsubscribeProfile = undefined;

        if (!firebaseUser) {
          if (isMounted) {
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setLoading(true);
        }

        const userRef = doc(
          firestore,
          COLLECTIONS.USERS,
          firebaseUser.uid
        );

        // Pantau profil agar perubahan dan pembuatan dokumen terdeteksi.
        unsubscribeProfile = onSnapshot(
          userRef,
          (userSnapshot) => {
            if (!isMounted) return;

            // Dokumen belum tersedia: tunggu sampai profil dibuat.
            // Jangan langsung sign out karena registrasi mungkin masih berjalan.
            if (!userSnapshot.exists()) {
              setCurrentUser(null);
              setLoading(false);
              return;
            }

            const data = userSnapshot.data();

            // Akun pending atau role tidak valid tidak boleh masuk.
            if (
              data.accountStatus !== 'active' ||
              !['asisten', 'praktikan'].includes(data.role)
            ) {
              setCurrentUser(null);
              setLoading(false);

              void signOut(firebaseAuth).catch((error) => {
                console.error(
                  '[AuthContext] Gagal sign out akun:',
                  error
                );
              });

              return;
            }

            const profile: CurrentUser = {
              uid: firebaseUser.uid,
              nama:
                typeof data.nama === 'string'
                  ? data.nama
                  : firebaseUser.displayName ?? '',
              email:
                typeof data.email === 'string'
                  ? data.email
                  : firebaseUser.email ?? '',
              role: data.role as UserRole,
              ...(typeof data.nim === 'string' && {
                nim: data.nim,
              }),
              ...(typeof data.kelas === 'string' && {
                kelas: data.kelas,
              }),
            };

            setCurrentUser(profile);
            setLoading(false);
          },
          (error) => {
            console.error(
              '[AuthContext] Gagal memantau profil:',
              error
            );

            if (isMounted) {
              setCurrentUser(null);
              setLoading(false);
            }
          }
        );
      }
    );

    return () => {
      isMounted = false;
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
