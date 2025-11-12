//수정완료
// screens/SignUpScreen.js 
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, Switch, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import api from '../services/api';

const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textLight: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  error: '#EF4444',
};

export default function SignUpScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [major, setMajor] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [isLeave, setIsLeave] = useState(false);

  const [genderPublic, setGenderPublic] = useState(true);
  const [majorPublic, setMajorPublic] = useState(true);
  const [gradePublic, setGradePublic] = useState(true);

  const majors = [
    '경영대학', '인문사회과학대학', '수산과학대학', '공학대학', '글로벌자유전공학부',
    '정보융합대학', '자유전공학부', '자연과학대학', '환경해양대학', '학부대학', '미래융합학부'
  ];

  const [openMajor, setOpenMajor] = useState(false);
  const [majorItems, setMajorItems] = useState(
    majors.map(item => ({ label: item, value: item }))
  );

  const handleEmailVerify = async () => {
    try {
      if (!email.endsWith('@pukyong.ac.kr')) {
        Alert.alert('오류', '부경대학교 이메일만 사용 가능합니다.');
        return;
      }
      const res = await api.post('/auth/check-email', { email });
      if (res.data.exists) {
        Alert.alert('중복 이메일', '이미 가입된 이메일입니다.');
        return;
      }
      await api.post('/auth/request-email-verification', { email });
      Alert.alert('성공', '학교 이메일로 인증 코드가 발송되었습니다.');
    } catch (error) {
      Alert.alert('오류', error.response?.data?.message || '서버 오류');
    }
  };

  const handleEmailCodeCheck = async () => {
    try {
      const res = await api.post(
        '/auth/verify-email-code',
        { email, code: verificationCode },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.data.verified) {
        setIsEmailVerified(true);
        Alert.alert('성공', '이메일 인증이 완료되었습니다.');
      } else {
        Alert.alert('실패', '인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      Alert.alert('오류', error.response?.data?.message || '서버 오류');
    }
  };

  const handleCheckUsername = async () => {
    if (username.length < 2 || username.length > 12) {
      Alert.alert('닉네임은 2~12자 이내여야 합니다.');
      return;
    }
    try {
      await api.post('/auth/check-username', { username });
      Alert.alert('사용 가능', '사용 가능한 닉네임입니다.');
      setUsernameChecked(true);
    } catch (error) {
      Alert.alert('중복', error.response?.data?.message || '서버 오류');
      setUsernameChecked(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !username || !password || !confirmPassword || !gender || !major || !selectedGrade) {
      Alert.alert('모든 항목을 입력해주세요.');
      return;
    }
    if (!email.endsWith('@pukyong.ac.kr')) {
      Alert.alert('부경대학교 이메일만 사용 가능합니다.');
      return;
    }
    if (!isEmailVerified) {
      Alert.alert('이메일 인증을 완료해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!usernameChecked) {
      Alert.alert('닉네임 중복 확인을 해주세요.');
      return;
    }

    try {
      await api.post('/auth/register', {
        email,
        password,
        username,
        gender,
        major,
        grade: selectedGrade,
        isLeave,
        privacy: {
          gender: genderPublic,
          major: majorPublic,
          grade: gradePublic
        }
      });
      Alert.alert('회원가입 성공', '로그인 페이지로 이동합니다.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('회원가입 실패', error.response?.data?.message || '서버 오류');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>회원가입</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 이메일 인증 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>학교 이메일 인증</Text>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={COLORS.muted} />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={handleEmailVerify}>
              <Text style={styles.actionButtonText}>인증 요청</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={18} color={COLORS.muted} />
              <TextInput
                style={styles.input}
                placeholder="인증 코드 6자리"
                placeholderTextColor={COLORS.muted}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            <TouchableOpacity 
              style={[styles.actionButton, isEmailVerified && styles.actionButtonSuccess]} 
              onPress={handleEmailCodeCheck}
            >
              {isEmailVerified ? (
                <Ionicons name="checkmark" size={18} color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>확인</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 비밀번호 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>비밀번호</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="비밀번호 확인"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        {/* 닉네임 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>닉네임</Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={COLORS.muted} />
              <TextInput
                style={styles.input}
                placeholder="닉네임 (2~12자)"
                placeholderTextColor={COLORS.muted}
                value={username}
                onChangeText={setUsername}
                maxLength={12}
              />
            </View>
            <TouchableOpacity 
              style={[styles.actionButton, usernameChecked && styles.actionButtonSuccess]} 
              onPress={handleCheckUsername}
            >
              {usernameChecked ? (
                <Ionicons name="checkmark" size={18} color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>중복확인</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 성별 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Ionicons name="male-female" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>성별</Text>
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>공개</Text>
              <Switch
                value={genderPublic}
                onValueChange={setGenderPublic}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={genderPublic ? COLORS.primary : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.optionButton, gender === '남' && styles.optionButtonSelected]}
              onPress={() => setGender('남')}
            >
              <Ionicons 
                name="male" 
                size={20} 
                color={gender === '남' ? '#fff' : COLORS.textLight} 
              />
              <Text style={[styles.optionText, gender === '남' && styles.optionTextSelected]}>
                남성
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, gender === '여' && styles.optionButtonSelected]}
              onPress={() => setGender('여')}
            >
              <Ionicons 
                name="female" 
                size={20} 
                color={gender === '여' ? '#fff' : COLORS.textLight} 
              />
              <Text style={[styles.optionText, gender === '여' && styles.optionTextSelected]}>
                여성
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 학과 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>학과</Text>
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>공개</Text>
              <Switch
                value={majorPublic}
                onValueChange={setMajorPublic}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={majorPublic ? COLORS.primary : '#f4f3f4'}
              />
            </View>
          </View>

          <DropDownPicker
            open={openMajor}
            value={major}
            items={majorItems}
            setOpen={setOpenMajor}
            setValue={setMajor}
            setItems={setMajorItems}
            placeholder="학과를 선택하세요"
            placeholderStyle={{ color: COLORS.muted }}
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={{ color: COLORS.text }}
          />
        </View>

        {/* 학년 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>학년</Text>
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>공개</Text>
              <Switch
                value={gradePublic}
                onValueChange={setGradePublic}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={gradePublic ? COLORS.primary : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.gradeGrid}>
            {['1', '2', '3', '4'].map(year => (
              <TouchableOpacity
                key={year}
                style={[styles.gradeButton, selectedGrade === year && styles.gradeButtonSelected]}
                onPress={() => setSelectedGrade(year)}
              >
                <Text style={[styles.gradeText, selectedGrade === year && styles.gradeTextSelected]}>
                  {year}학년
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 휴학 여부 */}
        <View style={styles.section}>
          <View style={styles.leaveRow}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pause-circle" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>휴학 여부</Text>
            </View>
            <Switch
              value={isLeave}
              onValueChange={setIsLeave}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={isLeave ? COLORS.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* 회원가입 버튼 */}
        <TouchableOpacity 
          style={styles.signUpButton} 
          onPress={handleSignUp}
          activeOpacity={0.8}
        >
          <Text style={styles.signUpButtonText}>회원가입</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  actionButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 14,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  optionTextSelected: {
    color: '#fff',
  },
  dropdown: {
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: COLORS.card,
    minHeight: 52,
  },
  dropdownContainer: {
    borderColor: COLORS.border,
    borderRadius: 12,
    marginTop: 4,
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gradeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  gradeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  gradeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  gradeTextSelected: {
    color: '#fff',
  },
  leaveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  signUpButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});