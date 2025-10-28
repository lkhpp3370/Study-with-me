//수정완료
// screens/ForgotPasswordScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [isLoadingVerify, setIsLoadingVerify] = useState(false);
  const [isLoadingReset, setIsLoadingReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }
    setIsLoadingCode(true);
    try {
      await api.post('/auth/request-reset', { email });
      Alert.alert('성공', '이메일로 인증 코드가 발송되었습니다.');
    } catch (error) {
      Alert.alert('실패', error.response?.data?.message || '서버 오류가 발생했습니다.');
    } finally {
      setIsLoadingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode.trim()) {
      Alert.alert('오류', '인증 코드를 입력해주세요.');
      return;
    }
    setIsLoadingVerify(true);
    try {
      const response = await api.post('/auth/verify-reset-code', {
        email,
        code: resetCode
      });

      if (response.data.verified) {
        setCodeVerified(true);
        Alert.alert('성공', '코드가 확인되었습니다. 새 비밀번호를 입력하세요.');
      }
    } catch (error) {
      Alert.alert('실패', error.response?.data?.message || '코드 확인에 실패했습니다.');
    } finally {
      setIsLoadingVerify(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !newPasswordConfirm.trim()) {
      Alert.alert('오류', '새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setIsLoadingReset(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        code: resetCode,
        newPassword
      });
      Alert.alert('성공', '비밀번호가 변경되었습니다. 로그인 해주세요.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('실패', error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsLoadingReset(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#4C63D2" />
            </TouchableOpacity>
          </View>

          <View style={styles.topSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-open-outline" size={56} color="#4C63D2" />
            </View>
            <Text style={styles.title}>비밀번호 찾기</Text>
            <Text style={styles.subtitle}>등록된 이메일로 인증 코드를 받고 새 비밀번호를 설정하세요</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Step 1: 이메일 입력 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1단계: 이메일 인증</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.emailInput}
                  placeholder="등록된 이메일 입력"
                  placeholderTextColor="#AAA"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!codeVerified}
                />
                <TouchableOpacity 
                  style={[styles.actionBtn, isLoadingCode && styles.btnDisabled]}
                  onPress={handleRequestCode}
                  disabled={isLoadingCode || codeVerified}
                >
                  <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.actionBtnText}>
                    {isLoadingCode ? '전송중...' : '인증 요청'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Step 2: 코드 확인 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2단계: 코드 확인</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="인증 코드 6자리"
                  placeholderTextColor="#AAA"
                  value={resetCode}
                  onChangeText={setResetCode}
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!codeVerified}
                />
                <TouchableOpacity 
                  style={[styles.actionBtn, isLoadingVerify && styles.btnDisabled]}
                  onPress={handleVerifyCode}
                  disabled={isLoadingVerify || codeVerified || !email}
                >
                  <Ionicons name="checkmark-done" size={18} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.actionBtnText}>
                    {isLoadingVerify ? '확인중...' : '확인'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Step 3: 비밀번호 재설정 */}
            {codeVerified && (
              <View style={[styles.section, styles.sectionActive]}>
                <Text style={styles.sectionTitle}>3단계: 새 비밀번호 설정</Text>
                
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="새 비밀번호 (6자 이상)"
                    placeholderTextColor="#AAA"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.iconBtn}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#4C63D2" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="비밀번호 재확인"
                    placeholderTextColor="#AAA"
                    value={newPasswordConfirm}
                    onChangeText={setNewPasswordConfirm}
                    secureTextEntry={!showPasswordConfirm}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    style={styles.iconBtn}
                  >
                    <Ionicons 
                      name={showPasswordConfirm ? "eye-off" : "eye"} 
                      size={20} 
                      color="#4C63D2" 
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.submitBtn, isLoadingReset && styles.btnDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoadingReset}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>
                    {isLoadingReset ? '변경중...' : '비밀번호 변경'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.helpSection}>
            <Text style={styles.helpText}>💡 인증 코드는 이메일로 발송됩니다.</Text>
            <Text style={styles.helpText}>스팸 폴더도 확인해주세요.</Text>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8EAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  formContainer: {
    paddingHorizontal: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionActive: {
    borderColor: '#D5D9FF',
    backgroundColor: '#F8F9FF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4C63D2',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emailInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFBFC',
  },
  codeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFBFC',
    letterSpacing: 4,
    textAlign: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 2,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  iconBtn: {
    padding: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    paddingVertical: 14,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    elevation: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  helpSection: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#E8EAFF',
    borderRadius: 10,
    marginTop: 20,
  },
  helpText: {
    fontSize: 12,
    color: '#4C63D2',
    fontWeight: '500',
    lineHeight: 18,
  },
});