import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PetaLaboratoriumView } from '../../../components/PetaLaboratoriumView';

export default function PetaPraktikanScreen() {
  return (
    <View style={styles.container}>
      <PetaLaboratoriumView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
