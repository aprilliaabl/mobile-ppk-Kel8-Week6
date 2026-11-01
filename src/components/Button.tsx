import { Pressable, Text, StyleSheet } from 'react-native';
import { W } from '../constants/warna';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'success' | 'danger' | 'ghost';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.85, transform: [{ scale: 0.985 }] },
      ]}
    >
      <Text style={[styles.label, labelColor[variant], disabled && { color: W.sub }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 50, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: W.blue },
  success: { backgroundColor: W.green },
  danger: { backgroundColor: W.red },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: W.blue },
  ghost: { backgroundColor: 'transparent' },
  disabled: { backgroundColor: W.cardAlt, borderColor: W.cardAlt },
  label: { fontSize: 15, fontWeight: '700' },
});

const labelColor = StyleSheet.create({
  primary: { color: '#FFFFFF' },
  success: { color: '#FFFFFF' },
  danger: { color: '#FFFFFF' },
  outline: { color: W.blue },
  ghost: { color: W.sub },
});
