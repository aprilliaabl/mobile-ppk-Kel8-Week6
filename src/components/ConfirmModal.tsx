import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ikon, NamaIkon } from './Ikon';
import { W } from '../constants/warna';

interface Props {
  visible: boolean;
  onClose: () => void;
  ikon: NamaIkon;
  tone?: 'success' | 'danger' | 'info';
  title: string;
  message?: string;
  children?: React.ReactNode;
  actions: React.ReactNode;
}

const TONE = {
  success: { bg: W.greenSoft, fg: W.green },
  danger: { bg: W.redSoft, fg: W.red },
  info: { bg: W.blueSoft, fg: W.blue },
};

/** Modal di tengah layar untuk konfirmasi atau umpan balik singkat. */
export function ConfirmModal({ visible, onClose, ikon, tone = 'info', title, message, children, actions }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.ikon, { backgroundColor: TONE[tone].bg }]}>
            <Ikon nama={ikon} size={28} color={TONE[tone].fg} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          {children}
          <View style={styles.actions}>{actions}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: W.card, borderRadius: 24, padding: 22, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: W.line },
  ikon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 19, fontWeight: '800', color: W.text, textAlign: 'center' },
  message: { fontSize: 14, color: W.sub, textAlign: 'center', lineHeight: 20 },
  actions: { alignSelf: 'stretch', gap: 8, marginTop: 10 },
});
