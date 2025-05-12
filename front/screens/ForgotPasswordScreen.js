// screens/ForgotPasswordScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  // ✅ 이메일로 인증 코드 요청
  const handleRequestCode = async () => {
    try {
      await axios.post('http://192.168.45.173:3000/auth/request-reset', { email });
      Alert.alert('성공', '이메일로 인증 코드가 발송되었습니다.');
    } catch (error) {
      Alert.alert('실패', error.response?.data?.message || '서버 오류');
    }
  };

  // ✅ 코드 확인 (서버 자체 코드 확인 API가 없다면 그냥 코드 입력만 확인하는 형태로 사용 가능)
  const handleVerifyCode = async () => {
    try {
      // 👉 실제 개발 시에는 /auth/verify-reset-code 라는 API를 별도로 만들면 좋음.
      // 지금은 서버에서 코드 확인은 reset-password 단계에서만 하므로 임시로 true 처리
      if (!resetCode) {
        Alert.alert('오류', '인증 코드를 입력해주세요.');
        return;
      }
      setCodeVerified(true);
      Alert.alert('성공', '코드 입력 완료. 새 비밀번호를 입력하세요.');
    } catch (error) {
      Alert.alert('실패', error.response?.data?.message || '서버 오류');
    }
  };

  // ✅ 비밀번호 변경
  const handleResetPassword = async () => {
    if (newPassword !== newPasswordConfirm) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await axios.post('http://192.168.45.173:3000/auth/reset-password', {
        email,
        code: resetCode,
        newPassword
      });
      Alert.alert('성공', '비밀번호가 변경되었습니다. 로그인 해주세요.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('실패', error.response?.data?.message || '서버 오류');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>비밀번호 찾기</Text>

      {/* 이메일 입력 + 인증 코드 발송 버튼 */}
      <View style={styles.row}>
        <TextInput
          style={styles.inputHalf}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity style={styles.subButtonSmall} onPress={handleRequestCode}>
          <Text style={styles.subButtonText}>인증 요청</Text>
        </TouchableOpacity>
      </View>

      {/* 인증 코드 입력 + 코드 확인 버튼 */}
      <View style={styles.row}>
        <TextInput
          style={styles.inputHalf}
          placeholder="인증 코드 입력"
          value={resetCode}
          onChangeText={setResetCode}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.subButtonSmall} onPress={handleVerifyCode}>
          <Text style={styles.subButtonText}>코드 확인</Text>
        </TouchableOpacity>
      </View>

      {/* 새 비밀번호 입력 + 비밀번호 확인 */}
      {codeVerified && (
        <>
          <TextInput
            style={styles.input}
            placeholder="새 비밀번호"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="새 비밀번호 확인"
            value={newPasswordConfirm}
            onChangeText={setNewPasswordConfirm}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <Text style={styles.buttonText}>비밀번호 변경</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 8 },
  inputHalf: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 8, flex: 1 },
  button: { backgroundColor: '#1e3a8a', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subButtonSmall: { backgroundColor: '#aaa', padding: 8, borderRadius: 6, alignItems: 'center', marginLeft: 8, marginTop: 8 },
  subButtonText: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center' },
});

