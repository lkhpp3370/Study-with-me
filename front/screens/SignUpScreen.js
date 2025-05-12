// screens/SignUpScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

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
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [isLeave, setIsLeave] = useState(false);

  const [genderPublic, setGenderPublic] = useState(true);
  const [majorPublic, setMajorPublic] = useState(true);
  const [gradePublic, setGradePublic] = useState(true);

  const majors = ['정보융합대학', '경영대학', '공과대학', '사회과학대학', '수산대학'];

  // ✅ 이메일 인증 요청 + 중복 이메일 체크
  const handleEmailVerify = async () => {
    try {
      // 이메일 형식 체크
      if (!email.endsWith('@pukyong.ac.kr')) {
        Alert.alert('오류', '부경대학교 이메일만 사용 가능합니다.');
        return;
      }

      // 이메일 중복 체크
      const res = await axios.post('http://192.168.XX.XXX:3000/auth/check-email', { email });
      if (res.data.exists) {
        Alert.alert('중복 이메일', '이미 가입된 이메일입니다.');
        return;
      }

      // 중복이 없으면 이메일 인증 코드 요청
      await axios.post('http://192.168.XX.XXX:3000/auth/request-email-verification', { email });
      Alert.alert('성공', '학교 이메일로 인증 코드가 발송되었습니다.');
    } catch (error) {
      Alert.alert('오류', error.response?.data?.message || '서버 오류');
    }
  };

  // ✅ 이메일 코드 확인
  const handleEmailCodeCheck = async () => {
    try {
      const res = await axios.post(
        'http://192.168.XX.XXX:3000/auth/verify-email-code',
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

  // ✅ 닉네임 중복 확인
  const handleCheckUsername = async () => {
    if (username.length < 2 || username.length > 12) {
      Alert.alert('닉네임은 2~12자 이내여야 합니다.');
      return;
    }
    try {
      await axios.post('http://192.168.XX.XXX:3000/auth/check-username', { username });
      Alert.alert('사용 가능', '사용 가능한 닉네임입니다.');
      setUsernameChecked(true);
    } catch (error) {
      Alert.alert('중복', error.response?.data?.message || '서버 오류');
      setUsernameChecked(false);
    }
  };

  // ✅ 회원가입 요청
  const handleSignUp = async () => {
    if (!email || !username || !password || !confirmPassword || !gender || !selectedMajor || !selectedGrade) {
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
      await axios.post('http://192.168.45.173:3000/auth/register', {
        email,
        password,
        username,
        gender,
        major: selectedMajor,
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>학교 이메일</Text>
      <View style={styles.row}>
        <TextInput style={styles.inputHalf} placeholder="이메일" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TouchableOpacity style={styles.subButtonSmall} onPress={handleEmailVerify}>
          <Text style={styles.subButtonText}>인증 요청</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TextInput style={styles.inputHalf} placeholder="인증 코드 입력" value={verificationCode} onChangeText={setVerificationCode} keyboardType="numeric" />
        <TouchableOpacity style={styles.subButtonSmall} onPress={handleEmailCodeCheck}>
          <Text style={styles.subButtonText}>코드 확인</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>비밀번호 설정</Text>
      <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="비밀번호 확인" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

      <Text style={styles.sectionTitle}>닉네임</Text>
      <View style={styles.row}>
        <TextInput style={styles.inputHalf} placeholder="닉네임 (2~12자)" value={username} onChangeText={setUsername} />
        <TouchableOpacity style={styles.subButtonSmall} onPress={handleCheckUsername}>
          <Text style={styles.subButtonText}>중복 확인</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>성별</Text>
        <View style={styles.switchRow}>
          <Text>공개</Text>
          <Switch value={genderPublic} onValueChange={setGenderPublic} />
        </View>
      </View>
      <View style={styles.radioRow}>
        <TouchableOpacity onPress={() => setGender('남')}><Text style={gender === '남' ? styles.radioSelected : styles.radio}>남</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setGender('여')}><Text style={gender === '여' ? styles.radioSelected : styles.radio}>여</Text></TouchableOpacity>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>학과</Text>
        <View style={styles.switchRow}>
          <Text>공개</Text>
          <Switch value={majorPublic} onValueChange={setMajorPublic} />
        </View>
      </View>
      {majors.map(item => (
        <TouchableOpacity key={item} onPress={() => setSelectedMajor(item)} style={styles.option}>
          <Text style={selectedMajor === item ? styles.optionSelected : styles.optionText}>{item}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>학년</Text>
        <View style={styles.switchRow}>
          <Text>공개</Text>
          <Switch value={gradePublic} onValueChange={setGradePublic} />
        </View>
      </View>
      <View style={styles.radioRow}>
        {['1', '2', '3', '4'].map(year => (
          <TouchableOpacity key={year} onPress={() => setSelectedGrade(year)}>
            <Text style={selectedGrade === year ? styles.radioSelected : styles.radio}>{year}학년</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>휴학 여부</Text>
        <Switch value={isLeave} onValueChange={setIsLeave} />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// 스타일
const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 8 },
  inputHalf: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 8, flex: 1 },
  button: { backgroundColor: '#1e3a8a', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subButtonSmall: { backgroundColor: '#aaa', padding: 8, borderRadius: 6, alignItems: 'center', marginLeft: 8, marginTop: 8 },
  subButtonText: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  radioRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  radio: { fontSize: 16, padding: 10, borderWidth: 1, borderColor: '#aaa', borderRadius: 8, marginHorizontal: 5 },
  radioSelected: { fontSize: 16, padding: 10, borderWidth: 1, borderColor: '#1e3a8a', backgroundColor: '#1e3a8a', color: '#fff', borderRadius: 8, marginHorizontal: 5 },
  option: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  optionText: { fontSize: 15 },
  optionSelected: { fontSize: 15, fontWeight: 'bold', color: '#1e3a8a' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }
});
