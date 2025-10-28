// screens/CreateStudyScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const DRAFT_KEY = '@createStudyDraft_v2';

const CreateStudyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [studyName, setStudyName] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [description, setDescription] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameChecked, setNameChecked] = useState(false);
  const [lastCheckedName, setLastCheckedName] = useState(''); // ✓ 어떤 이름으로 중복확인을 했는지 저장
  const skipRestoreOnceRef = useRef(false);

  // 헤더 숨김
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const clearDraft = async () => {
      try {
        await AsyncStorage.removeItem(DRAFT_KEY);
        console.log('🧹 Draft cleared on fresh entry');
      } catch (err) {
        console.error('Failed to clear draft:', err);
      }
    };
    clearDraft();
  }, []);

  // ◼︎ 포커스될 때마다: route.params(있으면 우선) + DRAFT(보조)로 안전 복원
  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      const restore = async () => {
        if (skipRestoreOnceRef.current) {
          skipRestoreOnceRef.current = false;
          return;
        }
        try {
          const draftStr = await AsyncStorage.getItem(DRAFT_KEY);
          const draft = draftStr ? JSON.parse(draftStr) : null;

          // 1) 우선 route.params 반영
          if (route.params?.selectedCategories) setSelectedCategories(route.params.selectedCategories);
          if (route.params?.studyName !== undefined) setStudyName(route.params.studyName);
          if (route.params?.maxMembers !== undefined) setMaxMembers(route.params.maxMembers);
          if (route.params?.description !== undefined) setDescription(route.params.description);

          // 2) 부족한 값은 draft로 메꾼다(상대 화면이 파라미터 안 줘도 복원)
          const noParamsProvided =
            !route.params?.selectedCategories &&
            route.params?.studyName === undefined &&
            route.params?.maxMembers === undefined &&
            route.params?.description === undefined;

          if (draft) {
            if (!route.params?.selectedCategories && Array.isArray(draft.selectedCategories)) {
              setSelectedCategories(draft.selectedCategories);
            }
            if (route.params?.studyName === undefined && typeof draft.studyName === 'string') {
              setStudyName(draft.studyName);
            }
            if (route.params?.maxMembers === undefined && typeof draft.maxMembers === 'string') {
              setMaxMembers(draft.maxMembers);
            }
            if (route.params?.description === undefined && typeof draft.description === 'string') {
              setDescription(draft.description);
            }

            // 3) 중복확인 상태는 '확인했던 이름'과 현재 이름이 같을 때만 유지
            if (typeof draft.nameChecked === 'boolean' && typeof draft.lastCheckedName === 'string') {
              const candidateName =
                route.params?.studyName !== undefined ? route.params.studyName :
                draft.studyName !== undefined ? draft.studyName : '';
              if (candidateName && candidateName === draft.lastCheckedName) {
                setNameChecked(draft.nameChecked);
                setLastCheckedName(draft.lastCheckedName);
              } else {
                // 이름이 다르면 중복확인 무효화
                setNameChecked(false);
                setLastCheckedName('');
              }
            }
          }

          // 드래프트는 여기서 지우지 않는다. (새 인스턴스가 떠도 계속 복원 가능하도록)
          // 필요한 시점(성공 생성)이나 사용자가 화면을 완전히 벗어날 때 지우면 됨.
        } catch (e) {
          // noop
        }
      };

      if (active) restore();
      return () => { active = false; };
    }, [route.params])
  );

  // 이름 중복 확인(강제)
  const checkDuplicateName = async () => {
    const title = (studyName || '').trim();
    if (!title) {
      Alert.alert('알림', '스터디 이름을 입력해주세요');
      return;
    }
    setIsCheckingName(true);
    try {
      const res = await api.get('/studies/check-title', { params: { title } });
      if (res.data?.available) {
        setNameChecked(true);
        setLastCheckedName(title); // ✓ 어떤 이름을 확인했는지 기록
        // draft에도 즉시 반영
        await saveDraft({ lastCheckedName: title, nameChecked: true });
        Alert.alert('성공', '사용 가능한 이름입니다! ✓');
      } else {
        setNameChecked(false);
        setLastCheckedName('');
        await saveDraft({ lastCheckedName: '', nameChecked: false });
        Alert.alert('중복', '이미 존재하는 스터디 이름입니다.');
      }
    } catch (err) {
      console.error('❌ 중복 확인 실패:', err?.response?.data || err.message);
      Alert.alert('오류', '중복 확인에 실패했습니다');
    } finally {
      setIsCheckingName(false);
    }
  };

  // 현재 상태를 드래프트로 저장(부분 업데이트 머지)
  const saveDraft = async (patch = {}) => {
    try {
      const prevStr = await AsyncStorage.getItem(DRAFT_KEY);
      const prev = prevStr ? JSON.parse(prevStr) : {};
      const next = {
        ...prev,
        studyName,
        maxMembers,
        description,
        selectedCategories,
        nameChecked,
        lastCheckedName,
        ...patch,
      };
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch (_) {}
  };

  const goCategorySelect = async () => {
    await saveDraft();
    navigation.navigate('카테고리선택', {
      selectedCategories,
      studyName,
      maxMembers,
      description,
      // ★ 콜백으로 결과만 반영 (화면 재오픈/병합 없이)
      onSelect: async (result) => {
        skipRestoreOnceRef.current = true;          // 복귀 직후 복원 스킵
        setSelectedCategories(Array.isArray(result) ? result : []);
        await saveDraft({ selectedCategories: Array.isArray(result) ? result : [] }); // 드래프트 동기화
      },
    });
  };

  const handleCreate = async () => {
    if (!studyName || !description) {
      Alert.alert('알림', '필수 항목을 모두 입력해주세요');
      return;
    }
    // 이름을 바꾸지 않았다면 nameChecked 유지됨. 바꿨으면 false.
    if (!nameChecked || lastCheckedName !== (studyName || '').trim()) {
      Alert.alert('알림', '스터디 이름 중복 확인을 완료해주세요');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');

      // 카테고리 해석 (네 로직 유지)
      const mainCategories = ['취업', '자격증', '대회', '영어', '출석'];
      const category = selectedCategories.find(c => mainCategories.includes(c)) || '';
      const subCategory = selectedCategories.find(
        c => !mainCategories.includes(c) &&
             c !== '자유' && c !== '정규' &&
             c !== '남' && c !== '여' && c !== '무관' &&
             !['월','화','수','목','금','토','일'].includes(c)
      ) || '';
      const duration = selectedCategories.includes('정규') ? '정규' : '자유';
      const days = selectedCategories.filter(c => ['월','화','수','목','금','토','일'].includes(c));
      const gender_rule = selectedCategories.find(c => ['남','여','무관'].includes(c)) || '무관';

      await api.post('/studies/create', {
        title: studyName,
        description,
        category,
        subCategory,
        gender_rule,
        duration,
        days,
        capacity: maxMembers === '00' ? 0 : parseInt(maxMembers, 10) || 0,
        host: userId,
      });

      // 생성 성공 → 드래프트 제거 후 뒤로
      await AsyncStorage.removeItem(DRAFT_KEY);
      Alert.alert('성공', '스터디가 생성되었습니다!', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('❌ 스터디 생성 실패:', err?.response?.data || err.message);
      const msg = err?.response?.data?.message || '스터디 생성에 실패했습니다';
      Alert.alert('실패', msg);
    }
  };

  const renderCategoryChips = () => {
    return selectedCategories.map((cat) => (
      <View key={cat} style={styles.categoryChip}>
        <Text style={styles.categoryChipText}>{cat}</Text>
        <TouchableOpacity onPress={() => removeCategory(cat)} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={16} color="#4C63D2" />
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 커스텀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4C63D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>스터디 개설</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>스터디 이름</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex}
              placeholder="이름을 입력하세요 (최대 10자)"
              placeholderTextColor="#AAA"
              maxLength={10}
              value={studyName}
              onChangeText={(text) => {
                setStudyName(text);
                // 사용자가 직접 이름을 변경한 경우에만 중복확인 초기화
                if (text !== lastCheckedName) {
                  setNameChecked(false);
                }
              }}
              onBlur={() => saveDraft()} // 입력 변화가 있을 때마다 드래프트 갱신
            />
            <TouchableOpacity
              style={[styles.checkBtn, nameChecked && styles.checkBtnChecked]}
              onPress={checkDuplicateName}
              disabled={isCheckingName}
            >
              {nameChecked ? (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.checkBtnText}>확인됨</Text>
                </>
              ) : (
                <Text style={styles.checkBtnText}>중복 확인</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>최대 인원</Text>
            <Text style={styles.subLabel}>(선택)</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputFlex, { marginRight: 8 }]}
              placeholder="00을 입력하면 무제한 설정"
              placeholderTextColor="#AAA"
              keyboardType="numeric"
              value={maxMembers}
              onChangeText={(v) => { setMaxMembers(v); }}
              onBlur={() => saveDraft()}
            />
            <Text style={styles.unitText}>명</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>카테고리</Text>
            <Text style={styles.subLabel}>(선택)</Text>
          </View>
          <View style={styles.categoryContainer}>
            {renderCategoryChips()}
            <TouchableOpacity style={styles.addCategoryBtn} onPress={goCategorySelect}>
              <Ionicons name="add-circle-outline" size={20} color="#4C63D2" />
              <Text style={styles.addCategoryText}>카테고리 추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>스터디 소개</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <TextInput
            style={styles.descriptionInput}
            placeholder="스터디에 대해 소개해주세요 (최대 500자)"
            placeholderTextColor="#AAA"
            multiline
            maxLength={500}
            value={description}
            onChangeText={(v) => setDescription(v)}
            onBlur={() => saveDraft()}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} activeOpacity={0.7}>
          <Ionicons name="rocket" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.submitBtnText}>스터디 개설하기</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContent: { paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },

  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5F7FA',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  required: { fontSize: 14, color: '#FF5B5B', marginLeft: 4, fontWeight: '600' },
  subLabel: { fontSize: 12, color: '#999', marginLeft: 4, fontWeight: '400' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  checkBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    backgroundColor: '#4C63D2',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 2,
  },
  checkBtnChecked: { backgroundColor: '#22C55E' },
  checkBtnText: { color: 'white', fontWeight: '600', fontSize: 13 },
  unitText: { fontSize: 14, fontWeight: '500', color: '#666', minWidth: 30 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D5D9FF',
    gap: 6,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#4C63D2' },
  removeBtn: { padding: 2 },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderStyle: 'dashed',
    gap: 6,
  },
  addCategoryText: { fontSize: 13, fontWeight: '600', color: '#4C63D2' },
  descriptionInput: {
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 120,
    backgroundColor: '#FAFBFC',
  },
  charCount: { fontSize: 11, color: '#999', marginTop: 6, textAlign: 'right' },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});

export default CreateStudyScreen;
