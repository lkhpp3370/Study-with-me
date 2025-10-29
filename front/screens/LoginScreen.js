//수정완료
//screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, BackHandler, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert('앱 종료', '앱을 종료하시겠습니까?', [
          { text: '취소', onPress: () => null, style: 'cancel' },
          { text: '종료', onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      });
      return () => backHandler.remove();
    }, [])
  );

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력하세요.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      await AsyncStorage.setItem('userId', response.data.userId);
      await AsyncStorage.setItem('userName', response.data.username);
      Alert.alert('로그인 성공', `${response.data.username}님 환영합니다.`);
      navigation.replace('Tabs');
    } catch (err) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
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
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="school-outline" size={64} color="#4C63D2" />
            </View>
            <Text style={styles.appTitle}>StudyHub</Text>
            <Text style={styles.subtitle}>스터디를 함께하는 공간</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#4C63D2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="학교 이메일 입력"
                  placeholderTextColor="#AAA"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#4C63D2" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  placeholder="비밀번호 입력"
                  placeholderTextColor="#AAA"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#4C63D2"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <>
                  <Ionicons name="hourglass" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.loginButtonText}>로그인 중...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.loginButtonText}>로그인</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.footerLinks}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('회원가입')}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>회원가입</Text>
            </TouchableOpacity>
            <View style={styles.linkDivider} />
            <TouchableOpacity 
              onPress={() => navigation.navigate('비밀번호 찾기')}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>비밀번호 찾기</Text>
            </TouchableOpacity>
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
    flexGrow: 1,
    paddingBottom: 20,
  },
  topSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8EAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  formContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4C63D2',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 4,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
    paddingTop: 12,
  },
  linkText: {
    color: '#4C63D2',
    fontSize: 14,
    fontWeight: '600',
  },
  linkDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
});