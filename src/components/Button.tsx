import { Pressable, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
}

export function Button({ label, onPress, variant = 'primary' }: Props) {
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.primary,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.label, isOutline ? styles.labelOutline : styles.labelPrimary]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#2563EB' },
  outline: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#2563EB' },
  label: { fontSize: 16, fontWeight: '600' },
  labelPrimary: { color: '#FFFFFF' },
  labelOutline: { color: '#2563EB' },
});