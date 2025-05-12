// screens/SetProfile.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

export default function SetProfile() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const response = await axios.get(`http://192.168.45.173:3000/profile/${userId}`);
        setUsername(response.data.username);
        setMajor(response.data.major || '');
        setGrade(response.data.grade ? String(response.data.grade) : '');
      } catch (err) {
        console.error('프로필 불러오기 실패', err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await axios.put(`http://192.168.45.173:3000/profile/${userId}`, {
        username,
        major,
        grade
      });
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('실패', '프로필 수정 중 오류 발생');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>프로필 수정</Text>
      <TextInput style={styles.input} placeholder="닉네임" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="학과" value={major} onChangeText={setMajor} />
      <TextInput style={styles.input} placeholder="학년 (숫자만)" keyboardType="number-pad" value={grade} onChangeText={setGrade} />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>저장하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#1e3a8a', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
