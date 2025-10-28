import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const NAVY = '#0E2A3B';
const BORDER = '#F0F2F5';
const FLOATING = '#4F46E5';
const CHIP_BORDER = '#D9D5FF';  // 연한 파란 보더로 톤 다운
const CHIP_BG = '#FFFFFF';       // 칩은 화이트 배경
const CHIP_TEXT = FLOATING;     // 메인에서 쓰던 파란 텍스트
const SURFACE = '#F7F9FC';       // 아주 옅은 배경 톤
const MUTED = '#6B7280';

const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();

  const [filteredStudies, setFilteredStudies] = useState([]);
  const [categorySelected, setCategorySelected] = useState(false);
  const [userId, setUserId] = useState(null);

  // 로그인 유저 ID (그대로)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) setUserId(id);
      } catch (err) {
        console.error('❌ 사용자 ID 로드 실패:', err.message);
      }
    };
    loadUser();
  }, []);

  // 스터디 검색 (그대로)
  useEffect(() => {
    const fetchStudies = async () => {
      if (!isFocused) return;
      const p = route.params || {};
      const hasAnyFilter = !!(p.duration || p.gender_rule || p.category || p.subCategory);
      try {
        let res;
        if (hasAnyFilter) {
          const query = new URLSearchParams({
            ...(p.duration && { duration: p.duration }),
            ...(p.gender_rule && { gender_rule: p.gender_rule }),
            ...(p.category && { category: p.category }),
            ...(p.subCategory && { subCategory: p.subCategory }),
          }).toString();
          res = await api.get(`/studies/search?${query}`);
        } else {
          // ✅ 필터 없으면 전체 스터디 노출
          // 백엔드 구현에 따라 /studies/search (빈 쿼리) 또는 /studies 가 있을 수 있어 둘 다 시도
          try {
            res = await api.get('/studies/search'); // 빈 필터로 전체
          } catch {
            res = await api.get('/studies');        // 전체 목록 엔드포인트 폴백
          }
        }
        setFilteredStudies(res.data || []);
        // ✅ 기본 목록도 "선택됨"처럼 보여 안내문구가 안 뜨도록 처리
        setCategorySelected(true);
      } catch (err) {
        console.error('❌ 검색 실패:', err?.message);
        setFilteredStudies([]);
        setCategorySelected(true);
      }
    };
    fetchStudies();
  }, [route.params, isFocused]);

  // 칩 라벨(선택 없으면 빈 배열 -> 칩 영역 숨김)
  const chips = (() => {
    const p = route.params || {};
    const arr = [];
    if (p.category) arr.push(p.category);
    if (p.subCategory) arr.push(p.subCategory);
    if (p.gender_rule) arr.push(p.gender_rule);
    if (p.duration) arr.push(`${p.duration}`);
    return arr;
  })();

  return (
    <View style={styles.container}>
      {/* 상단 캡슐형 카테고리 설정 버튼 (톤만 변경) */}
      <TouchableOpacity
        onPress={() => navigation.navigate('카테고리검색')}
        activeOpacity={0.8}
        style={styles.categoryCapsule}
      >
        <Text style={styles.categoryText}>카테고리 설정</Text>
        <View style={styles.gearCircle}>
          <Ionicons name="options-outline" size={18} color="#3B3B3B" />
        </View>
      </TouchableOpacity>

      {/* 선택 칩 (있을 때만) */}
      {chips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroller}
          contentContainerStyle={styles.chipRow}
        >
          {chips.map((label, idx) => (
            <View key={`${label}-${idx}`} style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 상단 디바이더 */}
      <View style={styles.divider} />

      {/* 리스트 */}
      <ScrollView contentContainerStyle={styles.listWrap}>
        {!categorySelected ? (
          <Text style={styles.infoText}>카테고리를 설정하세요</Text>
        ) : filteredStudies.length === 0 ? (
          <Text style={styles.infoText}>조건에 맞는 스터디가 없습니다</Text>
        ) : (
          filteredStudies.map((study, i) => (
            <TouchableOpacity
              key={study._id}
              style={styles.card}
              onPress={() => navigation.navigate('스터디소개', { study, userId })}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>{study.title}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {study.category}{study.subCategory ? ` · ${study.subCategory}` : ''}
                </Text>
              </View>
              <View style={styles.metaWrap}>
                <Text style={styles.rowMeta}>
                  인원수 {study.members?.length ?? 0}/{study.capacity === 0 ? '∞' : study.capacity ?? 0}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#A3A3A3" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 플로팅 + 버튼 (디자인만 변경, 동작 동일) */}
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() => navigation.navigate('스터디개설')}
        activeOpacity={0.9}
      >
        <Text style={styles.plusText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  categoryCapsule: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F3F5F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EDF0F4',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  gearCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E9EDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  chipsScroller: { flexGrow: 0, flexShrink: 0, maxHeight: 44 },
  chipRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    alignItems: 'center',
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    borderRadius: 16,
    backgroundColor: CHIP_BG,
    marginRight: 8,
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
  },
  chipText: { color: CHIP_TEXT, fontSize: 13, fontWeight: '700' },

  divider: { height: 1, backgroundColor: BORDER, marginTop: 8 },

  listWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120, // 탭바/플로팅 버튼 피하기
    gap: 10,
  },

  infoText: {
    fontSize: 15,
    color: '#8A8A8A',
    textAlign: 'center',
    marginTop: 24,
  },

  // 카드형 리스트 아이템 (디자인만)
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF1F6',
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    // Android elevation
    elevation: 2,
  },
  rowTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  rowSub: { marginTop: 3, color: MUTED, fontSize: 12 },
  metaWrap: { marginLeft: 12, alignItems: 'flex-end' },
  rowMeta: { color: '#8A8A8A', fontSize: 12, marginBottom: 2 },

  // 플로팅 버튼 (보라 톤 + 더 둥글고 그림자)
  floatingBtn: {
    position: 'absolute',
    right: 16,
    bottom: 28, // 탭바 위로
    backgroundColor: FLOATING,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    zIndex: 10,
  },
  plusText: {
    fontSize: 30,
    color: 'white',
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
  },
});

export default SearchScreen;