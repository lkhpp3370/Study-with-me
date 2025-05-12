// screens/SettingScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function SettingScreen() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await AsyncStorage.clear();    // ✅ 모든 로그인 데이터 삭제
    Alert.alert('로그아웃', '로그아웃 되었습니다.');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  button: { backgroundColor: '#ff4d4d', padding: 14, borderRadius: 8, alignItems: 'center', width: 200 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
