//수정완료
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const detailedCategories = {
  취업: ['기획/전략', '회계/사무', '마케팅', 'IT', '디자인'],
  자격증: ['한국사', '토익', '컴활', '운전면허'],
  대회: ['공모전', '해커톤', '아이디어', '창업'],
  영어: ['토익', '토플', '스피킹', '회화'],
  출석: ['출석관리', '출결인증'],
};

const days = ['월', '화', '수', '목', '금', '토', '일'];

const CategorySelectScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [studyType, setStudyType] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [gender, setGender] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [selectedDetails, setSelectedDetails] = useState([]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false }); // ✅ 네이티브 헤더 숨기기
  }, [navigation]);

  const setMainCategoryAndReset = (next) => {
    setMainCategory(next);
    setSelectedDetails([]); // 메인 카테고리 바뀌면 상세 초기화
  };

  useEffect(() => {
    const incoming = route.params?.selectedCategories || [];
    const matchedStudyType = ['자유', '정규'].find((v) => incoming.includes(v));
    const matchedGender = ['남', '여', '무관'].find((v) => incoming.includes(v));
    const matchedMainCategory = Object.keys(detailedCategories).find((v) => incoming.includes(v));

    setStudyType(matchedStudyType || '');
    setGender(matchedGender || '');
    setMainCategory(matchedMainCategory || '');
    setSelectedDays(incoming.filter((d) => days.includes(d)));
    setSelectedDetails(
      matchedMainCategory
        ? incoming.filter((v) => detailedCategories[matchedMainCategory].includes(v))
        : []
    );
  }, [route.params?.selectedCategories]);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleDetail = (item) => {
    setSelectedDetails((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleSingle = (state, setter, value) => {
    setter(state === value ? '' : value);
  };

  const handleConfirm = () => {
    const result = [
      ...(studyType ? [studyType] : []),
      ...selectedDays,
      ...(gender ? [gender] : []),
      ...(mainCategory ? [mainCategory] : []),
      ...selectedDetails,
    ];
    // ★ CreateStudyScreen에서 넘긴 콜백으로 값만 전달
   route.params?.onSelect?.(result);
    // ★ 현재 화면만 닫기
    navigation.goBack();
  };
  

  const renderSection = (title, items, selected, onToggle, isMultiple = false) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.buttonGrid}>
        {items.map((item) => {
          const isSelected = isMultiple ? selected.includes(item) : selected === item;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.button, isSelected && styles.buttonSelected]}
              onPress={() =>
                isMultiple
                  ? onToggle(item)
                  : toggleSingle(selected, onToggle, item)
              }
            >
              <Text
                style={[
                  styles.buttonText,
                  isSelected && styles.buttonTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ 커스텀 헤더 (상단 고정) */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#4C63D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>카테고리 선택</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSection('스터디 종류', ['자유', '정규'], studyType, setStudyType)}

        {studyType === '정규' && renderSection('요일 선택', days, selectedDays, toggleDay, true)}

        {renderSection('성별', ['남', '여', '무관'], gender, setGender)}

        {renderSection(
          '스터디 분야',
          Object.keys(detailedCategories),
          mainCategory,
          setMainCategoryAndReset
        )}

        {mainCategory !== '' &&
          renderSection(
            '스터디 분야 (상세)',
            detailedCategories[mainCategory],
            selectedDetails,
            toggleDetail,
            true
          )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* ✅ 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.confirmText}>확인</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    minHeight: 44,
  },
  buttonSelected: {
    backgroundColor: '#4C63D2',
    borderColor: '#4C63D2',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  buttonTextSelected: {
    color: '#fff',
  },
  spacer: {
    height: 30,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});

export default CategorySelectScreen;
