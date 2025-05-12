// screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ✅ 로그인 처리 함수
  const handleLogin = async () => {
    try {
      const response = await axios.post('http://192.168.45.173:3000/auth/login', {
        email,
        password
      });

      await AsyncStorage.setItem('userId', response.data.userId);
      await AsyncStorage.setItem('userName', response.data.username);

      Alert.alert('로그인 성공', `${response.data.username}님 환영합니다.`);
      navigation.replace('Tabs');
    } catch (err) {
      Alert.alert('로그인 실패', '아이디 또는 비밀번호를 확인하세요.');
    }
  };

  // ✅ 뒤로가기 버튼으로 앱 종료 Alert 띄우기
  useEffect(() => {
    const backAction = () => {
      Alert.alert("앱 종료", "앱을 종료하시겠습니까?", [
        { text: "취소", onPress: () => null, style: "cancel" },
        { text: "종료", onPress: () => BackHandler.exitApp() }
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    // Cleanup the event listener when the component unmounts
    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>

      {/* ✅ 회원가입 + 비밀번호 찾기 버튼 추가 */}
      <View style={styles.linkContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('회원가입')}>
          <Text style={styles.linkText}>회원가입</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('비밀번호 찾기')}>
          <Text style={styles.linkText}>비밀번호 찾기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#1e3a8a', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  linkText: { color: '#1e3a8a', fontWeight: 'bold' }
});
