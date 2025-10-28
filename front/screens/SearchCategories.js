// front/screens/SearchCategories.js
import React, { useState, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#4F46E5',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#94A3B8',
};

const detailedCategories = {
  취업: ['기획/전략', '회계/사무', '마케팅', 'IT', '디자인'],
  자격증: ['한국사', '토익', '컴활', '운전면허'],
  대회: ['공모전', '해커톤', '아이디어', '창업'],
  영어: ['토익', '토플', '스피킹', '회화'],
  출석: ['출석관리', '출결인증'],
};

const SearchCategories = () => {
  const navigation = useNavigation();

  // ✅ 네이티브 헤더 숨기기 (중복 제거)
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false, title: '' });
  }, [navigation]);

  const [duration, setDuration] = useState(null);
  const [gender_rule, setGender] = useState(null);
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);

  const toggleSelection = (current, setter, value) => {
    setter(current === value ? null : value);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 커스텀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>카테고리 검색</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 스터디 종류 */}
        <View style={styles.section}>
          <Text style={styles.title}>스터디 종류</Text>
          <View style={styles.row}>
            {['자유', '정규'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.button, duration === type && styles.selectedButton]}
                onPress={() => toggleSelection(duration, setDuration, type)}
              >
                <Text style={[styles.buttonText, duration === type && styles.selectedButtonText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 성별 */}
        <View style={styles.section}>
          <Text style={styles.title}>성별</Text>
          <View style={styles.row}>
            {['남', '여', '무관'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.button, gender_rule === g && styles.selectedButton]}
                onPress={() => toggleSelection(gender_rule, setGender, g)}
              >
                <Text style={[styles.buttonText, gender_rule === g && styles.selectedButtonText]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 스터디 분야 */}
        <View style={styles.section}>
          <Text style={styles.title}>스터디 분야</Text>
          <View style={styles.rowWrap}>
            {Object.keys(detailedCategories).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chipButton, category === cat && styles.selectedChipButton]}
                onPress={() => {
                  setCategory(category === cat ? null : cat);
                  setSubCategory(null);
                }}
              >
                <Text style={[styles.chipText, category === cat && styles.selectedChipText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 세부 분야 */}
        {category && (
          <View style={styles.section}>
            <Text style={styles.title}>세부 분야</Text>
            <View style={styles.rowWrap}>
              {detailedCategories[category].map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[styles.chipButton, subCategory === sub && styles.selectedChipButton]}
                  onPress={() => toggleSelection(subCategory, setSubCategory, sub)}
                >
                  <Text style={[styles.chipText, subCategory === sub && styles.selectedChipText]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 검색 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() =>
            navigation.navigate('Tabs', {
              screen: '검색',
              params: { duration, gender_rule, category, subCategory },
            })
          }
        >
          <Ionicons name="search" size={20} color="#fff" style={styles.searchIcon} />
          <Text style={styles.submitButtonText}>검색 결과 보기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 20 },

  section: { marginBottom: 32 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 16, color: COLORS.text },
  row: { flexDirection: 'row', gap: 10 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  selectedButton: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  buttonText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  selectedButtonText: { color: '#fff', fontWeight: '600' },

  chipButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  selectedChipButton: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  selectedChipText: { color: '#fff', fontWeight: '600' },

  bottomContainer: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: { marginRight: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default SearchCategories;
