import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/** Memaksa layar render ulang setiap kali kembali difokuskan (data presensi disimpan di memori, bukan state). */
export function useRefreshOnFocus() {
  const [tick, setTick] = useState(0);
  useFocusEffect(useCallback(() => setTick((t) => t + 1), []));
  return tick;
}
