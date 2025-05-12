// screens/NotificationScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NotificationScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>알림 내역 페이지</Text>
      <Text style={styles.subText}>아직 알림이 없습니다.</Text>
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, fontWeight: 'bold' },
  subText: { fontSize: 16, marginTop: 10, color: '#666' }
});
