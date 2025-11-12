import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function AttendanceCheckScreen() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // ✅ 네이티브 헤더 숨기기 (중복 제거)
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchSchedules = async () => {
    try {
      const uid = await AsyncStorage.getItem('userId');
      const res = await api.get(`/attendance/host/${uid}/schedules`);
      setSchedules(res.data || []);
    } catch (err) {
      console.error('내가 개최한 일정 불러오기 실패:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchSchedules();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedules();
    setRefreshing(false);
  };

  const getScheduleStatus = (schedule) => {
    if (schedule.type === 'past') {
      return {
        icon: 'checkmark-done-circle',
        color: '#22C55E',
        bgColor: '#ECFDF5',
        text: '종료됨',
      };
    } else if (schedule.canCheck) {
      return {
        icon: 'play-circle',
        color: '#4C63D2',
        bgColor: '#F8F9FF',
        text: '체크 가능',
      };
    } else {
      return {
        icon: 'time-outline',
        color: '#999',
        bgColor: '#F5F5F5',
        text: '체크 불가',
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C63D2" />
        <Text style={styles.loadingText}>일정을 불러오는 중</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ 커스텀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4C63D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>출석 체크</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>내가 개최한 일정</Text>
          <Text style={styles.subtitle}>출석 체크 현황을 확인하세요</Text>
        </View>

        {schedules.length > 0 ? (
          <View style={styles.scheduleList}>
            {schedules.map((s, i) => {
              const status = getScheduleStatus(s);
              const isPast = s.type === 'past';
              const dateStr = new Date(s.startDate).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              });
              const dayStr = new Date(s.startDate).toLocaleDateString('ko-KR', { weekday: 'short' });

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.scheduleCard,
                    isPast && styles.scheduleCardPast,
                  ]}
                  onPress={() => navigation.navigate('AttendanceDetail', { scheduleId: s._id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.scheduleLeft}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateText}>{dateStr}</Text>
                      <Text style={styles.dayText}>{dayStr}</Text>
                    </View>
                  </View>

                  <View style={styles.scheduleContent}>
                    <Text style={styles.scheduleTitle} numberOfLines={1}>
                      {s.title}
                    </Text>
                    {isPast ? (
                      <View style={styles.summaryContainer}>
                        <View style={styles.summaryItem}>
                          <Ionicons name="checkmark-circle" size={14} color="#22C55E" style={{ marginRight: 4 }} />
                          <Text style={styles.summaryText}>
                            출석 {s.summary?.출석 ?? 0}
                          </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                          <Ionicons name="close-circle" size={14} color="#FF5B5B" style={{ marginRight: 4 }} />
                          <Text style={styles.summaryText}>
                            결석 {s.summary?.결석 ?? 0}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.scheduleSubtitle}>
                        {s.canCheck ? '출석 체크 가능' : '아직 체크 시간이 아닙니다'}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                    <Ionicons name={status.icon} size={18} color={status.color} style={{ marginBottom: 4 }} />
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D5D9FF" />
            <Text style={styles.emptyText}>내가 개최한 일정이 없습니다</Text>
            <Text style={styles.emptySubText}>스터디를 만들어 출석을 관리해보세요</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContainer: { flex: 1 },

  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFBFC',
  },
  loadingText: { marginTop: 16, fontSize: 14, color: '#666', fontWeight: '500' },

  // ✅ 커스텀 헤더
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },

  titleSection: {
    paddingHorizontal: 16, paddingVertical: 20, backgroundColor: '#fff',
    marginHorizontal: 12, marginVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#999', fontWeight: '500' },

  scheduleList: { paddingHorizontal: 12, gap: 10 },

  scheduleCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: '#4C63D2', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, elevation: 2,
  },
  scheduleCardPast: { backgroundColor: '#F8F9FF', borderColor: '#E8EAFF', opacity: 0.9 },

  scheduleLeft: { marginRight: 14 },
  dateBox: {
    backgroundColor: '#4C63D2', paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, alignItems: 'center', minWidth: 60,
  },
  dateText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  dayText: { fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 },

  scheduleContent: { flex: 1 },
  scheduleTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 6 },
  scheduleSubtitle: { fontSize: 12, color: '#999' },

  summaryContainer: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flexDirection: 'row', alignItems: 'center' },
  summaryText: { fontSize: 12, fontWeight: '600', color: '#666' },
  summaryDivider: { width: 1, height: 12, backgroundColor: '#E0E0E0', marginHorizontal: 8 },

  statusBadge: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, minWidth: 56 },
  statusText: { fontSize: 11, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginTop: 16 },
  emptySubText: { fontSize: 13, color: '#999', marginTop: 6, textAlign: 'center' },
});
