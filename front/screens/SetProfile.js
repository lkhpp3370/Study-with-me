//수정완료
// screens/SetProfile.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform, Image, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import DropDownPicker from 'react-native-dropdown-picker';
import * as ImagePicker from 'expo-image-picker';

export default function SetProfile() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [gender, setGender] = useState('');
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState('');
  const [isLeave, setIsLeave] = useState(false);
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');

  const [genderPublic, setGenderPublic] = useState(true);
  const [majorPublic, setMajorPublic] = useState(true);
  const [gradePublic, setGradePublic] = useState(true);

  const majors = ['경영대학','인문사회과학대학','수산과학대학','공학대학','글로벌자유전공학부','정보융합대학','자유전공학부','자연과학대학','환경해양대학','학부대학','미래융합학부'];
  const [openMajor, setOpenMajor] = useState(false);
  const [majorItems, setMajorItems] = useState(majors.map(item => ({ label: item, value: item })));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const response = await api.get(`/profile/${userId}`);
        const data = response.data;
        setUsername(data.username);
        setMajor(data.major ?? '');
        setGrade(data.grade ? String(data.grade) : '');
        setGender(data.gender ?? '');
        setIsLeave(data.isLeave ?? false);
        setBio(data.bio ?? '');
        setProfileImage(data.profile_image ?? '');
        setGenderPublic(data.privacy?.gender ?? true);
        setMajorPublic(data.privacy?.major ?? true);
        setGradePublic(data.privacy?.grade ?? true);
      } catch (err) {
        console.error('프로필 불러오기 실패', err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleCheckUsername = async () => {
    if (username.length < 2 || username.length > 12) {
      Alert.alert('알림', '닉네임은 2~12자 이내여야 합니다.');
      return;
    }
    try {
      await api.post('/auth/check-username', { username });
      Alert.alert('성공', '사용 가능한 닉네임입니다.');
      setUsernameChecked(true);
    } catch (error) {
      Alert.alert('알림', error.response?.data?.message || '서버 오류');
      setUsernameChecked(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log('이미지 선택 오류:', err);
    }
  };

  const handleSave = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await api.put(`/profile/${userId}`, {
        username,
        major,
        grade: Number(grade),
        gender,
        isLeave,
        bio,
        profile_image: profileImage,
        privacy: { gender: genderPublic, major: majorPublic, grade: gradePublic }
      });
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('실패', '프로필 수정 중 오류 발생');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4C63D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 설정</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 프로필 사진 섹션 */}
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>프로필 사진</Text>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person-circle-outline" size={64} color="#D5D9FF" />
                </View>
              )}
            </View>
            <View style={styles.imageButtonRow}>
              <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.imageButtonText}>이미지 선택</Text>
              </TouchableOpacity>
              {profileImage && (
                <TouchableOpacity 
                  style={[styles.imageButton, styles.imageButtonDelete]}
                  onPress={() => setProfileImage('')}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF5B5B" style={{ marginRight: 6 }} />
                  <Text style={[styles.imageButtonText, { color: '#FF5B5B' }]}>삭제</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 닉네임 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>닉네임</Text>
            <View style={styles.inputRow}>
              <TextInput 
                style={styles.inputFlex}
                placeholder="닉네임 (2~12자)"
                placeholderTextColor="#AAA"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setUsernameChecked(false);
                }}
              />
              <TouchableOpacity 
                style={[styles.checkButton, usernameChecked && styles.checkButtonChecked]}
                onPress={handleCheckUsername}
              >
                {usernameChecked ? (
                  <>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.checkButtonText}>확인됨</Text>
                  </>
                ) : (
                  <Text style={styles.checkButtonText}>중복 확인</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 성별 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>성별</Text>
              <View style={styles.privacyToggle}>
                <Ionicons name={genderPublic ? "eye-outline" : "eye-off-outline"} size={14} color="#4C63D2" style={{ marginRight: 4 }} />
                <Switch 
                  value={genderPublic}
                  onValueChange={setGenderPublic}
                  trackColor={{ false: '#ccc', true: '#B5BFFF' }}
                  thumbColor={genderPublic ? '#4C63D2' : '#f4f3f4'}
                />
              </View>
            </View>
            <View style={styles.optionRow}>
              {['남', '여'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    gender === option && styles.optionButtonSelected
                  ]}
                  onPress={() => setGender(option)}
                >
                  <Text style={[
                    styles.optionText,
                    gender === option && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 학과 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>학과</Text>
              <View style={styles.privacyToggle}>
                <Ionicons name={majorPublic ? "eye-outline" : "eye-off-outline"} size={14} color="#4C63D2" style={{ marginRight: 4 }} />
                <Switch 
                  value={majorPublic}
                  onValueChange={setMajorPublic}
                  trackColor={{ false: '#ccc', true: '#B5BFFF' }}
                  thumbColor={majorPublic ? '#4C63D2' : '#f4f3f4'}
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
              placeholder="학과 선택"
              listMode="SCROLLVIEW"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              placeholderStyle={styles.dropdownPlaceholder}
              arrowIconStyle={styles.dropdownArrow}
              selectedItemLabelStyle={styles.dropdownSelected}
            />
          </View>

          {/* 학년 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>학년</Text>
              <View style={styles.privacyToggle}>
                <Ionicons name={gradePublic ? "eye-outline" : "eye-off-outline"} size={14} color="#4C63D2" style={{ marginRight: 4 }} />
                <Switch 
                  value={gradePublic}
                  onValueChange={setGradePublic}
                  trackColor={{ false: '#ccc', true: '#B5BFFF' }}
                  thumbColor={gradePublic ? '#4C63D2' : '#f4f3f4'}
                />
              </View>
            </View>
            <View style={styles.optionRow}>
              {['1', '2', '3', '4'].map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.optionButton,
                    grade === year && styles.optionButtonSelected
                  ]}
                  onPress={() => setGrade(year)}
                >
                  <Text style={[
                    styles.optionText,
                    grade === year && styles.optionTextSelected
                  ]}>
                    {year}학년
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 휴학 여부 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>휴학 여부</Text>
              <Switch 
                value={isLeave}
                onValueChange={setIsLeave}
                trackColor={{ false: '#ccc', true: '#B5BFFF' }}
                thumbColor={isLeave ? '#4C63D2' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* 소개글 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>소개글</Text>
            <TextInput
              style={styles.textArea}
              placeholder="자기소개를 입력하세요 (선택사항)"
              placeholderTextColor="#AAA"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>

          {/* 저장 버튼 */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>프로필 저장</Text>
          </TouchableOpacity>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#E8EAFF',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8EAFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  imageButton: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  imageButtonDelete: {
    backgroundColor: '#FEF2F2',
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: {
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
  checkButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#4C63D2',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkButtonChecked: {
    backgroundColor: '#22C55E',
  },
  checkButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 10,
    backgroundColor: '#FAFBFC',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#4C63D2',
    borderColor: '#4C63D2',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionTextSelected: {
    color: '#fff',
  },
  dropdown: {
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 10,
    backgroundColor: '#FAFBFC',
    paddingHorizontal: 12,
    height: 48,
  },
  dropdownContainer: {
    borderColor: '#E8EAFF',
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownPlaceholder: {
    color: '#AAA',
  },
  dropdownArrow: {
    tintColor: '#4C63D2',
  },
  dropdownSelected: {
    color: '#4C63D2',
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    backgroundColor: '#FAFBFC',
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});