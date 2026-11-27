import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { W } from '../constants/warna';
import { Ikon } from './Ikon';

/** Kerangka halaman login/registrasi: gelap, ramah keyboard, dan terpusat di layar lebar. */
export function AuthShell({ judul, subjudul, children }: { judul: string; subjudul: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: W.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
      >
        <View style={styles.inner}>
          <View style={styles.logo}>
            <Ikon nama="centang" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.judul}>{judul}</Text>
          <Text style={styles.sub}>{subjudul}</Text>
          <View style={styles.card}>{children}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'characters' | 'sentences';
  editable?: boolean;
  hint?: string;
}

export function FieldInput({ label, value, onChangeText, placeholder, error, secure, keyboardType, autoCapitalize = 'none', editable = true, hint }: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={W.sub}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable}
        style={[styles.input, !!error && { borderColor: W.red }]}
      />
      {!!error ? <Text style={styles.error}>{error}</Text> : !!hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function PilihanChip({ label, aktif, onPress, disabled }: { label: string; aktif: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: aktif }}
      style={[styles.chip, aktif && styles.chipAktif]}
    >
      <Text style={[styles.chipText, aktif && { color: '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

export function KotakGalat({ pesan }: { pesan: string }) {
  return (
    <View style={styles.galat} accessibilityRole="alert">
      <Text style={styles.galatText}>{pesan}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 6 },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: W.blue, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  judul: { fontSize: 26, fontWeight: '800', color: W.text, textAlign: 'center' },
  sub: { fontSize: 14, color: W.sub, textAlign: 'center', marginBottom: 18 },
  card: { backgroundColor: W.card, borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: W.line },
  label: { fontSize: 13, fontWeight: '700', color: W.text },
  input: { backgroundColor: W.bg, borderWidth: 1.5, borderColor: W.cardAlt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: W.text },
  error: { fontSize: 12, color: W.red, fontWeight: '600' },
  hint: { fontSize: 12, color: W.sub },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: W.cardAlt, borderWidth: 1, borderColor: W.line },
  chipAktif: { backgroundColor: W.blue, borderColor: W.blue },
  chipText: { fontSize: 14, fontWeight: '700', color: W.sub },
  galat: { backgroundColor: W.redSoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: W.red },
  galatText: { color: W.red, fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
