import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import api from '../services/api';

const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();

  const [filteredStudies, setFilteredStudies] = useState([]);
  const [categorySelected, setCategorySelected] = useState(false);

  useEffect(() => {
  const fetchStudies = async () => {
    if (isFocused && route.params) {
      const { duration, gender_rule, category, subCategory } = route.params;
      try {
        const query = new URLSearchParams({
          ...(duration && { duration }),
          ...(gender_rule && { gender_rule }),
          ...(category && { category }),
          ...(subCategory && { subCategory }),
        }).toString();

        const res = await api.get(`/studies/search?${query}`);
        setFilteredStudies(res.data);
        setCategorySelected(true);
      } catch (err) {
        console.error('❌ 검색 실패:', err.message);
      }
    }
  };
  fetchStudies();
}, [route.params, isFocused]);


  return (
    <View style={styles.container}>
      {/* 상단 카테고리 설정 버튼 */}
      <TouchableOpacity
        style={styles.categoryBtn}
        onPress={() => navigation.navigate('카테고리검색')}>
        <Text style={styles.categoryBtnText}>카테고리 설정</Text>
      </TouchableOpacity>

      {/* 스터디 목록 or 안내 문구 */}
      <ScrollView contentContainerStyle={styles.contentBox}>
        {!categorySelected ? (
          <Text style={styles.infoText}>카테고리를 설정하세요</Text>
        ) : filteredStudies.length === 0 ? (
          <Text style={styles.infoText}>조건에 맞는 스터디가 없습니다</Text>
        ) : (
          filteredStudies.map((study) => (
            <TouchableOpacity
              key={study._id}
              style={styles.studyCard}
              onPress={() => navigation.navigate('스터디소개', { study })}
            >
              <Text style={styles.studyTitle}>{study.title}</Text>
              <Text style={{ color: '#888' }}>
                {study.category}{study.subCategory ? ` - ${study.subCategory}` : ''}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 하단 + 버튼 (개설 페이지 이동) */}
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() => navigation.navigate('스터디개설')}>
        <Text style={styles.plusText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  categoryBtn: {
    padding: 14,
    backgroundColor: '#cce5ff',
    alignItems: 'center'
  },
  categoryBtnText: { fontWeight: 'bold', fontSize: 16 },
  contentBox: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoText: { fontSize: 16, color: '#888' },
  studyCard: {
    width: '100%',
    backgroundColor: '#f1f1f1',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6
  },
  floatingBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#00aaff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
  },
  plusText: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
    lineHeight: 30,
    textAlign: 'center'
  },
  studyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
});

export default SearchScreen;
