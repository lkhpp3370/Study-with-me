import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const detailedCategories = {
  취업: ['기획/전략', '회계/사무', '마케팅', 'IT', '디자인'],
  자격증: ['한국사', '토익', '컴활', '운전면허'],
  대회: ['공모전', '해커톤', '아이디어', '창업'],
  영어: ['토익', '토플', '스피킹', '회화'],
  출석: ['출석관리', '출결인증']
};

const SearchCategories = ({ navigation }) => {
  const [duration, setDuration] = useState(null);       // 자유 / 정규
  const [gender_rule, setGender] = useState(null);      // 남 / 여 / 무관
  const [category, setCategory] = useState(null);       // 취업 / 자격증 / 대회 / 영어 / 출석
  const [subCategory, setSubCategory] = useState(null); // 세부 분야

  const toggleSelection = (current, setter, value) => {
    setter(current === value ? null : value);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* 스터디 종류 */}
        <Text style={styles.title}>스터디 종류</Text>
        <View style={styles.row}>
          {['자유', '정규'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.button, duration === type && styles.selectedButton]}
              onPress={() => toggleSelection(duration, setDuration, type)}
            >
              <Text style={[styles.buttonText, duration === type && styles.selectedButtonText]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 성별 */}
        <Text style={styles.title}>성별</Text>
        <View style={styles.row}>
          {['남', '여', '무관'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.button, gender_rule === g && styles.selectedButton]}
              onPress={() => toggleSelection(gender_rule, setGender, g)}
            >
              <Text style={[styles.buttonText, gender_rule === g && styles.selectedButtonText]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 스터디 분야 */}
        <Text style={styles.title}>스터디 분야</Text>
        <View style={styles.rowWrap}>
          {Object.keys(detailedCategories).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.button, category === cat && styles.selectedButton]}
              onPress={() => {
                setCategory(category === cat ? null : cat);
                setSubCategory(null); // 새로운 카테고리 선택 시 subCategory 초기화
              }}
            >
              <Text style={[styles.buttonText, category === cat && styles.selectedButtonText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 세부 분야 */}
        {category && (
          <>
            <Text style={styles.title}>세부 분야</Text>
            <View style={styles.rowWrap}>
              {detailedCategories[category].map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[styles.button, subCategory === sub && styles.selectedButton]}
                  onPress={() => toggleSelection(subCategory, setSubCategory, sub)}
                >
                  <Text style={[styles.buttonText, subCategory === sub && styles.selectedButtonText]}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* 검색 버튼 */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={() =>
          navigation.navigate('Tabs', {
            screen: '검색', // Tab.Navigator 안의 "검색" 탭으로 이동
            params: { duration, gender_rule, category, subCategory },
          })
        }
      >
        <Text style={styles.submitButtonText}>검색 결과 보기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9', marginTop: 35 },
  title: { fontSize: 18, fontWeight: 'bold', marginVertical: 12, paddingLeft: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, paddingHorizontal: 8 },
  button: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedButton: { backgroundColor: '#17A1FA' },
  buttonText: { fontSize: 16, color: '#333' },
  selectedButtonText: { color: '#FFFFFF' },
  submitButton: {
    margin: 16,
    paddingVertical: 14,
    backgroundColor: '#0A2540',
    borderRadius: 35,
    alignItems: 'center',
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});

export default SearchCategories;
