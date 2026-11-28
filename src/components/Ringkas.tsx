import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ikon, type NamaIkon } from './Ikon';
import { W } from '../constants/warna';

/** Sapaan satu baris: judul kecil dan keterangan, tanpa kartu besar. */
export function Sapaan({ judul, keterangan, kanan }: { judul: string; keterangan?: string; kanan?: ReactNode }) {
  return (
    <View style={styles.sapaan}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sapaanJudul} numberOfLines={1}>{judul}</Text>
        {!!keterangan && <Text style={styles.sapaanKet} numberOfLines={1}>{keterangan}</Text>}
      </View>
      {kanan}
    </View>
  );
}

export interface ItemRingkas {
  label: string;
  value: string | number;
  color?: string;
}

/** Satu kartu tipis berisi beberapa angka ringkasan berdampingan (menggantikan deretan kartu statistik). */
export function RingkasStat({ items }: { items: ItemRingkas[] }) {
  return (
    <View style={styles.strip}>
      {items.map((it, i) => (
        <View key={it.label} style={[styles.cell, i > 0 && styles.cellBorder]}>
          <Text style={[styles.value, it.color ? { color: it.color } : null]}>{it.value}</Text>
          <Text style={styles.label} numberOfLines={1}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

export interface ItemPintasan {
  label: string;
  ikon: NamaIkon;
  onPress: () => void;
}

/** Baris ikon pintasan ke fitur yang tidak ada di bilah tab. Target sentuh minimal 48 dp. */
export function PintasanRow({ items }: { items: ItemPintasan[] }) {
  return (
    <View style={styles.pintasan}>
      {items.map((it) => (
        <Pressable
          key={it.label}
          onPress={it.onPress}
          accessibilityRole="button"
          accessibilityLabel={it.label}
          style={({ pressed }) => [styles.pintasanItem, pressed && { opacity: 0.7 }]}
        >
          <View style={styles.pintasanIkon}>
            <Ikon nama={it.ikon} size={20} color={W.blue} />
          </View>
          <Text style={styles.pintasanLabel} numberOfLines={1}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Bagian yang dapat dilipat agar beranda tidak panjang. Tertutup secara bawaan. */
export function Lipat({ judul, info, children }: { judul: string; info?: string; children: ReactNode }) {
  const [buka, setBuka] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        onPress={() => setBuka(!buka)}
        accessibilityRole="button"
        accessibilityState={{ expanded: buka }}
        style={styles.lipatHead}
      >
        <Text style={styles.lipatJudul}>{judul}</Text>
        {!!info && <Text style={styles.lipatInfo}>{info}</Text>}
        <Text style={styles.lipatPanah}>{buka ? 'Tutup' : 'Lihat'}</Text>
      </Pressable>
      {buka && children}
    </View>
  );
}

const styles = StyleSheet.create({
  sapaan: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sapaanJudul: { fontSize: 20, fontWeight: '800', color: W.text },
  sapaanKet: { fontSize: 13, color: W.sub, marginTop: 1 },
  strip: { flexDirection: 'row', backgroundColor: W.card, borderRadius: 16, borderWidth: 1, borderColor: W.line, paddingVertical: 10 },
  cell: { flex: 1, alignItems: 'center', gap: 2 },
  cellBorder: { borderLeftWidth: 1, borderLeftColor: W.line },
  value: { fontSize: 20, fontWeight: '800', color: W.text },
  label: { fontSize: 11, color: W.sub },
  pintasan: { flexDirection: 'row', justifyContent: 'space-between' },
  pintasanItem: { flex: 1, alignItems: 'center', gap: 4, minHeight: 64 },
  pintasanIkon: { width: 44, height: 44, borderRadius: 14, backgroundColor: W.blueSoft, alignItems: 'center', justifyContent: 'center' },
  pintasanLabel: { fontSize: 11, fontWeight: '600', color: W.sub },
  lipatHead: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: W.card, borderRadius: 14, borderWidth: 1, borderColor: W.line, paddingHorizontal: 14, minHeight: 48 },
  lipatJudul: { flex: 1, fontSize: 14, fontWeight: '700', color: W.text },
  lipatInfo: { fontSize: 12, color: W.sub },
  lipatPanah: { fontSize: 12, fontWeight: '800', color: W.blue },
});
