// screens/StudyDetailScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

const StudyDetailScreen = () => {
  const route = useRoute();
  const { study } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{study.title}</Text>
      <Text style={styles.description}>{study.description}</Text>
      <Text style={styles.info}>스터디 ID: {study._id}</Text>
    </View>
  );
};

export default StudyDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  description: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 10 },
  info: { fontSize: 14, color: '#999' }
});
