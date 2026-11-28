import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Pengguna, Role } from '../constants/types';

/**
 * Profil pengguna untuk peran tertentu, bersumber dari akun Firebase yang sedang login.
 * Untuk peran praktikan, `kelasList` berisi kelas dari profil dan keanggotaan laboratorium.
 */
export function useCurrentUser(role: Role): Pengguna {
  const { currentUser, keanggotaan } = useAuth();
  return useMemo(() => {
    const kelasSet = new Set<string>();
    if (role === 'praktikan') {
      if (currentUser?.kelas) kelasSet.add(currentUser.kelas);
      keanggotaan.filter((a) => a.role === 'praktikan' && a.kelas).forEach((a) => kelasSet.add(a.kelas));
    }
    const kelasList = Array.from(kelasSet);
    return {
      id: currentUser?.uid ?? '',
      nama: currentUser?.nama ?? '',
      email: currentUser?.email,
      nim: currentUser?.nim,
      kelas: kelasList[0],
      kelasList,
      role,
    };
  }, [currentUser, keanggotaan, role]);
}
