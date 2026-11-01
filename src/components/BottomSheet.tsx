import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { W } from '../constants/warna';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const native = Platform.OS !== 'web';

/** Panel yang naik dari bawah layar, dipakai untuk form dan konfirmasi. */
export function BottomSheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, { toValue: 1, duration: 240, useNativeDriver: native }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: native }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, anim]);

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: anim }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Tutup" />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 20, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }] },
          ]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  sheet: { width: '100%', maxWidth: 480, backgroundColor: W.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 14, borderWidth: 1, borderColor: W.line },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: W.cardAlt, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '800', color: W.text },
});
