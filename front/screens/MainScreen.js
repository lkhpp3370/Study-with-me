// front/screens/MainScreen.js (실서버 동작 + 모던 디자인 적용본)
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, BackHandler, Modal, TextInput, Switch, Platform,
  RefreshControl, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';

/** ---------- 디자인 팔레트 ---------- */
const COLORS = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textLight: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  study: '#818CF8',
  routine: '#34D399',
};

/** ---------- 상수/도우미 ---------- */
const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8~22시
const daysKo = ['월', '화', '수', '목', '금', '토', '일'];
const koToDow = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
const indexToDow = [1, 2, 3, 4, 5, 6, 0]; // 월~일 순서

// 시간 라벨(50px) + 7일 = 카드 폭 맞춤
const screenWidth = Dimensions.get('window').width;
const TIME_LABEL_WIDTH = 50;
// 🔧 수정: 카드 좌우 마진 16px씩(총 32px)을 고려해 칸 너비 계산
const dayWidth = Math.floor((screenWidth - 32 - TIME_LABEL_WIDTH) / 7);

// "HH:mm" -> {h, m}
const parseHHmm = (s) => {
  if (!s) return { h: 0, m: 0 };
  const [hh, mm] = String(s).split(':').map(n => parseInt(n, 10));
  return { h: hh || 0, m: mm || 0 };
};
const hourToHHmm = (h) => `${String(h).padStart(2, '0')}:00`;

const startOfWeekMon = (d) => {
  const x = new Date(d);
  const day = x.getDay(); // 0=일
  const diffToMonday = (day + 6) % 7;
  x.setDate(x.getDate() - diffToMonday);
  x.setHours(0, 0, 0, 0);
  return x;
};
const isSameWeek = (a, b) => startOfWeekMon(a).getTime() === startOfWeekMon(b).getTime();
const isAfterOrSameWeek = (week, base) => startOfWeekMon(week).getTime() >= startOfWeekMon(base).getTime();

/** ---------- 컴포넌트 ---------- */
export default function MainScreen() {
  const navigation = useNavigation();

  const [userName, setUserName] = useState('');
  const [studyGroups, setStudyGroups] = useState([]);
  const [schedules, setSchedules] = useState([]); // 서버에서 내려오는 스터디 일정
  const [routinesRaw, setRoutinesRaw] = useState([]);

  // 새로고침 상태
  const [refreshing, setRefreshing] = useState(false);

  // 루틴 추가 모달/입력
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [newRoutine, setNewRoutine] = useState({
    title: '',
    days: [],          // 다중 요일
    startHour: 8,
    endHour: 9,
    repeatWeekly: true,
    startDate: new Date(), // 표시 기준 시작일(주차 기준)
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

  // 주간 시작(월요일)
  const [weekStart, setWeekStart] = useState(() => startOfWeekMon(new Date()));
  const [showWeekPicker, setShowWeekPicker] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  /** 뒤로가기 종료 */
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert("앱 종료", "앱을 종료하시겠습니까?", [
          { text: "취소", style: "cancel" },
          { text: "종료", onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      });
      return () => backHandler.remove();
    }, [])
  );

  /** 데이터 로드 */
  const fetchData = useCallback(async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const userId = await AsyncStorage.getItem('userId');
      if (name) setUserName(name);
      
      // ✅ userId를 상태에 저장
      if (userId) setCurrentUserId(userId); 
      if (!userId) return;

      const [studyRes, routineRes] = await Promise.all([
        api.get(`/main/${userId}`),     // { studies, schedules }
        api.get(`/routine/${userId}`),  // Routine[]
      ]);
      setStudyGroups(studyRes.data?.studies ?? []);
      setSchedules(studyRes.data?.schedules ?? []);
      setRoutinesRaw(routineRes.data ?? []);
    } catch (err) {
      console.error('불러오기 실패:', err.message);
    } finally {
      setRefreshing(false);
    }
    // ✅ 의존성: useCallback의 의존성 배열은 비워둡니다 (함수 내부의 값은 변경되지 않으므로).
  }, []);

  // 최초 1회
  useEffect(() => { fetchData(); }, [fetchData]);

  // 화면 재진입 시마다 자동 새로고침
  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // 당겨서 새로고침
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  /** 스터디 일정 → 시간표 포맷 */
  const studySchedules = useMemo(() => {
    // schedules 배열을 반환하기 전에 filter()를 먼저 사용하여 참여 여부를 확인합니다.
    return (schedules || [])
      // ✅ 1. 필터링 로직 추가: currentUserId가 participants 배열에 포함된 일정만 남깁니다.
      .filter(s => s.participants && s.participants.includes(currentUserId))
      .map(s => {
        const base = s.startDate ? new Date(s.startDate) : new Date();
        const shouldShow = s.repeatWeekly
          ? isAfterOrSameWeek(weekStart, base)
          : isSameWeek(weekStart, base);
        if (!shouldShow) return null;

        const { h: sh, m: sm } = parseHHmm(s.startTime);
        const { h: eh, m: em } = parseHHmm(s.endTime);

        return {
          _id: s._id,
          title: s.title,
          description: s.description,
          location: s.location,
          study: s.study,
          day: s.dayOfWeek === 0 ? '일' : daysKo[s.dayOfWeek - 1],
          start: sh + sm / 60,
          end: eh + em / 60,
          type: 'study',
        };
      })
      .filter(Boolean);
    // ✅ 2. 의존성 배열에 currentUserId 추가 (currentUserId 값이 변경되면 재계산)
  }, [schedules, weekStart, currentUserId]);

  /** ✅ 오늘의 스터디 일정 (참여 여부 필터링 포함) */
  const todaySchedules = useMemo(() => {
    const today = new Date();
    const todayDow = today.getDay(); // 0(일) ~ 6(토)
    const currentWeekStart = startOfWeekMon(today);
    
    // ✅ 1. 참여자 필터링: 현재 사용자가 포함된 일정만 남깁니다.
    const userParticipatingSchedules = (schedules || []).filter(s => 
      s.participants && s.participants.includes(currentUserId)
    );

    return userParticipatingSchedules
      .map(s => {
        const base = s.startDate ? new Date(s.startDate) : new Date();
        const { h: sh, m: sm } = parseHHmm(s.startTime);
        const { h: eh, m: em } = parseHHmm(s.endTime);

        // 2. 요일이 오늘과 일치해야 함
        // dayOfWeek: 0=일요일, 1=월요일 ... 6=토요일
        if (s.dayOfWeek !== todayDow) return null; 
        
        // 3. 주차 조건 확인
        const shouldShow = s.repeatWeekly
          ? isAfterOrSameWeek(currentWeekStart, base)
          : isSameWeek(currentWeekStart, base);
        
        if (!shouldShow) return null;

        return {
          _id: s._id,
          title: s.title,
          description: s.description,
          location: s.location,
          start: sh + sm / 60,
          end: eh + em / 60,
        };
      }).filter(Boolean);
    // ✅ 4. 의존성 추가
  }, [schedules, currentUserId]);

  /** 루틴 → 시간표 포맷 */
  const routines = useMemo(() => {
    return (routinesRaw || []).map(r => {
      const base = r.startDate ? new Date(r.startDate) : (r.createdAt ? new Date(r.createdAt) : new Date());
      const shouldShow = r.repeatWeekly
        ? isAfterOrSameWeek(weekStart, base)
        : isSameWeek(weekStart, base);
      if (!shouldShow) return null;

      const { h: sh, m: sm } = parseHHmm(r.startTime);
      const { h: eh, m: em } = parseHHmm(r.endTime);

      return {
        _id: r._id,
        title: r.title,
        day: r.dayOfWeek === 0 ? '일' : daysKo[r.dayOfWeek - 1],
        start: sh + sm / 60,
        end: eh + em / 60,
        type: 'routine',
      };
    }).filter(Boolean);
  }, [routinesRaw, weekStart]);

  /** 합치기 */
  const mergedSchedules = useMemo(() => [...studySchedules, ...routines], [studySchedules, routines]);

  /** 주간 라벨 (요일/날짜) */
  const weekDates = useMemo(() => {
    return indexToDow.map((_, idx) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + idx);
      return { day: daysKo[idx], date: `${d.getMonth() + 1}/${d.getDate()}` };
    });
  }, [weekStart]);

  /** 주간 범위 텍스트 (25/9/8 ~ 9/14) */
  const weekRangeText = useMemo(() => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(start.getDate() + 6);
    const yy = String(start.getFullYear()).slice(2);
    const sm = start.getMonth() + 1, sd = start.getDate();
    const em = end.getMonth() + 1,   ed = end.getDate();
    return `${yy}/${sm}/${sd} ~ ${em}/${ed}`;
  }, [weekStart]);

  /** 주간 이동 */
  const goPrevWeek = () => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return startOfWeekMon(d); });
  const goNextWeek = () => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return startOfWeekMon(d); });

  /** 루틴 저장(다중 요일 → 다중 생성) */
  const handleAddRoutine = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!newRoutine.title.trim()) return Alert.alert('안내', '일정명을 입력해주세요.');
      if (!newRoutine.days.length)  return Alert.alert('안내', '요일을 1개 이상 선택해주세요.');
      if (newRoutine.endHour <= newRoutine.startHour) return Alert.alert('안내', '종료 시간이 시작 시간보다 커야 합니다.');

      const posts = newRoutine.days.map(async dayKo => {
        const payload = {
          user: userId,
          title: newRoutine.title,
          dayOfWeek: koToDow[dayKo],
          startDate: newRoutine.startDate,                  // ✅ 주차 기준
          startTime: hourToHHmm(newRoutine.startHour),
          endTime:   hourToHHmm(newRoutine.endHour),
          repeatWeekly: newRoutine.repeatWeekly,
          color: COLORS.routine,
        };
        const res = await api.post('/routine', payload);
        return res.data;
      });
      const created = await Promise.all(posts);
      setRoutinesRaw(prev => [...prev, ...created]);
      setRoutineModalVisible(false);
      setNewRoutine({ title: '', days: [], startHour: 8, endHour: 9, repeatWeekly: true, startDate: new Date() });
    } catch (err) {
      console.error('루틴 등록 실패:', err.message);
      Alert.alert('등록 실패', '입력값을 확인해주세요.');
    }
  };

  /** 루틴 삭제 */
  const handleDeleteRoutine = (id) => {
    Alert.alert('루틴 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소' },
      {
        text: '삭제', onPress: async () => {
          await api.delete(`/routine/${id}`);
          setRoutinesRaw(prev => prev.filter(r => r._id !== id));
        }
      }
    ]);
  };

  /** 렌더 */
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('내 프로필')}>
          <Text style={styles.username}>{userName || 'user_name'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('알림내역')} style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* 본문 */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 주간 선택 카드 */}
        <View style={styles.weekCard}>
          <TouchableOpacity onPress={goPrevWeek} style={styles.weekArrow}>
            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowWeekPicker(true)} style={styles.weekCenter}>
            <Text style={styles.weekText}>{weekRangeText}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goNextWeek} style={styles.weekArrow}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {showWeekPicker && (
          <DateTimePicker
            value={weekStart}
            mode="date"
            onChange={(e, date) => {
              if (Platform.OS !== 'ios') setShowWeekPicker(false);
              if (date) setWeekStart(startOfWeekMon(date));
            }}
          />
        )}

        {/* 시간표 카드 */}
        <View style={styles.timetableCard}>
          {/* 요일 헤더 + 루틴 추가 버튼 */}
          <View style={styles.timetableHeader}>
            <TouchableOpacity style={styles.addRoutineBtn} onPress={() => setRoutineModalVisible(true)}>
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
            {weekDates.map((item, i) => (
              <View key={i} style={[styles.dayHeader, { width: dayWidth }]}>
                <Text style={styles.dayText}>{item.day}</Text>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
            ))}
          </View>

          {/* 시간표 본문 */}
          {hours.map((hour) => (
            <View key={hour} style={styles.timeRow}>
              <View style={styles.timeLabel}>
                <Text style={styles.timeLabelText}>{hour}</Text>
              </View>

              {indexToDow.map((dow, i) => {
                const overlapping = mergedSchedules.filter(s =>
                  koToDow[s.day] === dow &&
                  s.start < hour + 1 &&
                  s.end > hour
                );

                if (overlapping.length === 0) {
                  return <View key={i} style={[styles.cell, { width: dayWidth }]} />;
                }

                const item = overlapping[0];
                const backgroundColor = item.type === 'study' ? COLORS.study : COLORS.routine;

                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => item.type === 'study'
                      ? navigation.navigate('Studyroommain', { studyId: item.study._id, studyName: item.study.title })
                      : handleDeleteRoutine(item._id)}
                    style={[styles.cell, styles.cellFilled, { width: dayWidth, backgroundColor }]}
                  >
                    <Text style={styles.cellText} numberOfLines={2}>{item.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* 이번 주 스터디 일정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            {/* 텍스트 수정 */}
            <Text style={styles.sectionTitle}>오늘의 스터디 일정</Text>
          </View>
          {/* todaySchedules로 변경 */}
          {todaySchedules.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={COLORS.muted} />
              {/* 텍스트 수정 */}
              <Text style={styles.emptyText}>오늘 스터디 일정이 없습니다</Text>
            </View>
          ) : (
            // todaySchedules로 변경
            todaySchedules.map((s) => (
              <View key={s._id} style={styles.scheduleCard}>
                <View style={styles.scheduleLeft}>
                  <View style={styles.scheduleIcon}>
                    <Ionicons name="book" size={20} color={COLORS.study} />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleTitle}>{s.title}</Text>
                    <Text style={styles.scheduleDetail}>
                      <Ionicons name="location" size={12} /> {s.location || '장소 미정'}
                    </Text>
                    {/* 시간 표시 */}
                    <Text style={styles.scheduleDetail}>
                      <Ionicons name="time" size={12} /> {Math.floor(s.start)}:00 ~ {Math.floor(s.end)}:00
                    </Text>
                    {!!s.description && (
                      <Text style={[styles.scheduleDetail, { marginTop: 2 }]} numberOfLines={2}>
                        {s.description}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 스터디 그룹 목록 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>내 스터디 그룹</Text>
          </View>
          {studyGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color={COLORS.muted} />
              <Text style={styles.emptyText}>가입중인 스터디가 없습니다</Text>
            </View>
          ) : (
            studyGroups.map((study) => (
              <TouchableOpacity
                key={study._id}
                style={styles.studyCard}
                onPress={() => navigation.navigate('Studyroommain', { studyId: study._id, studyName: study.title })}
                activeOpacity={0.7}
              >
                <View style={styles.studyIcon}>
                  <Ionicons name="book" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.studyInfo}>
                  <Text style={styles.studyTitle}>{study.title}</Text>
                  <Text style={styles.studyDesc} numberOfLines={2}>{study.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* 채팅 FAB */}
      <TouchableOpacity style={styles.chatFab} onPress={() => navigation.navigate('채팅목록')} activeOpacity={0.8}>
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
      </TouchableOpacity>

      {/* 루틴 추가 모달 */}
      <Modal visible={routineModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>개인 루틴 추가</Text>

            <Text style={styles.label}>일정명</Text>
            <TextInput
              value={newRoutine.title}
              onChangeText={(t) => setNewRoutine({ ...newRoutine, title: t })}
              style={styles.input}
              placeholder="예: 헬스장"
              placeholderTextColor={COLORS.muted}
            />

            {/* 시작일(주차 기준) */}
            <Text style={styles.label}>시작일</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.dateButtonText}>
                {`${newRoutine.startDate.getFullYear()}년 ${newRoutine.startDate.getMonth() + 1}월 ${newRoutine.startDate.getDate()}일`}
              </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={newRoutine.startDate}
                mode="date"
                onChange={(e, date) => {
                  setShowStartDatePicker(false);
                  if (date) setNewRoutine(prev => ({ ...prev, startDate: date }));
                }}
              />
            )}

            {/* 요일 (다중 선택) */}
            <Text style={styles.label}>요일 (복수 선택 가능)</Text>
            <View style={styles.dayGrid}>
              {daysKo.map(day => {
                const selected = newRoutine.days.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => {
                      setNewRoutine(prev => ({
                        ...prev,
                        days: selected ? prev.days.filter(d => d !== day) : [...prev.days, day]
                      }));
                    }}
                    style={[styles.dayButton, selected && styles.dayButtonSelected]}
                  >
                    <Text style={[styles.dayButtonText, selected && styles.dayButtonTextSelected]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 시간 입력 */}
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.label}>시작</Text>
                <TextInput
                  keyboardType="numeric"
                  value={String(newRoutine.startHour)}
                  onChangeText={(t) => setNewRoutine({ ...newRoutine, startHour: parseInt(t || '0', 10) })}
                  style={styles.timeInput}
                  placeholder="8"
                  placeholderTextColor={COLORS.muted}
                />
              </View>
              <View style={styles.timeInputGroup}>
                <Text style={styles.label}>종료</Text>
                <TextInput
                  keyboardType="numeric"
                  value={String(newRoutine.endHour)}
                  onChangeText={(t) => setNewRoutine({ ...newRoutine, endHour: parseInt(t || '0', 10) })}
                  style={styles.timeInput}
                  placeholder="10"
                  placeholderTextColor={COLORS.muted}
                />
              </View>
            </View>

            {/* 반복 스위치 */}
            <View style={styles.switchRow}>
              <Text style={styles.label}>매주 반복</Text>
              <Switch
                value={newRoutine.repeatWeekly}
                onValueChange={(v) => setNewRoutine({ ...newRoutine, repeatWeekly: v })}
                trackColor={{ false: COLORS.border, true: COLORS.primaryDark }}
                thumbColor={newRoutine.repeatWeekly ? COLORS.primary : '#f4f3f4'}
              />
            </View>

            {/* 액션 버튼 */}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setRoutineModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddRoutine} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** ---------- 스타일 ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: COLORS.card,
  },
  username: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  bellButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingBottom: 100 },

  weekCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 16, marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: COLORS.card,
    borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  weekArrow: { padding: 8 },
  weekCenter: { flex: 1, alignItems: 'center' },
  weekText: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  timetableCard: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.card,
    borderRadius: 16, overflow: 'hidden', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  timetableHeader: { flexDirection: 'row', backgroundColor: COLORS.bg, paddingVertical: 8 },
  addRoutineBtn: {
    width: TIME_LABEL_WIDTH, height: 50, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, margin: 4, borderRadius: 12
  },
  dayHeader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8,
    marginLeft:-1,
   },
  dayText: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  dateText: { fontSize: 11, color: COLORS.muted },

  timeRow: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: COLORS.border },
  timeLabel: { width: TIME_LABEL_WIDTH, height: 32, alignItems: 'center', justifyContent: 'center' },
  timeLabelText: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  cell: { height: 32, borderLeftWidth: 0.5, borderLeftColor: COLORS.border },
  cellFilled: { alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellText: { fontSize: 9, color: '#fff', fontWeight: '600', textAlign: 'center' },

  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },

  emptyCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 40, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  emptyText: { marginTop: 8, color: COLORS.muted },

  scheduleCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  scheduleLeft: { flexDirection: 'row', alignItems: 'center' },
  scheduleIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  scheduleInfo: { flex: 1 },
  scheduleTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  scheduleDetail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  studyCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 12, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  studyIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  studyInfo: { flex: 1 },
  studyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  studyDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  chatFab: {
    position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary,
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },

  label: { marginTop: 10, marginBottom: 6, fontSize: 13, color: COLORS.text },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, backgroundColor: '#F9FAFB' },

  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F9FAFB',
  },
  dateButtonText: { color: COLORS.text },

  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayButton: {
    paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, backgroundColor: COLORS.card,
  },
  dayButtonSelected: { backgroundColor: '#EEF2FF', borderColor: COLORS.primary },
  dayButtonText: { color: COLORS.text },
  dayButtonTextSelected: { color: COLORS.primary, fontWeight: '700' },

  timeInputRow: { flexDirection: 'row', gap: 12 },
  timeInputGroup: { flex: 1 },
  timeInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, backgroundColor: '#F9FAFB' },

  switchRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#EEF2FF', borderRadius: 10 },
  modalCancelText: { color: COLORS.primaryDark, fontWeight: '700' },
  modalSaveBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 10 },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});
