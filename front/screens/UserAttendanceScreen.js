//수정완료
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function UserAttendanceScreen() {
  const [records, setRecords] = useState([]);
  const [percent, setPercent] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // ✅ 네이티브 헤더 숨김(겹침 제거)
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchUserAttendance = async () => {
    try {
      const uid = await AsyncStorage.getItem('userId');
      const res = await api.get(`/attendance/user/${uid}/detail`);
      setRecords(res.data.records || []);
      setPercent(res.data.percent || 0);
    } catch (err) {
      console.error('내 출석 데이터 불러오기 실패:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAttendance();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserAttendance();
    setRefreshing(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case '출석': return { icon: 'checkmark-circle', color: '#22C55E', bgColor: '#ECFDF5' };
      case '지각': return { icon: 'time',            color: '#F59E0B', bgColor: '#FFFBEB' };
      case '결석': return { icon: 'close-circle',    color: '#FF5B5B', bgColor: '#FEF2F2' };
      default:     return { icon: 'help-circle',      color: '#999',    bgColor: '#F5F5F5' };
    }
  };

  const statsData = [
    { label: '총 출석', count: records.filter(r => r.status === '출석').length, icon: 'checkmark-done', color: '#22C55E' },
    { label: '지각',   count: records.filter(r => r.status === '지각').length,   icon: 'time',          color: '#F59E0B' },
    { label: '결석',   count: records.filter(r => r.status === '결석').length,   icon: 'close-circle',  color: '#FF5B5B' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ 커스텀 헤더 (상단 고정) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4C63D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 출석 기록</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.percentCard}>
          <View style={styles.percentCircle}>
            <Text style={styles.percentValue}>{percent}%</Text>
            <Text style={styles.percentLabel}>출석률</Text>
          </View>
          <View style={styles.percentInfo}>
            <Text style={styles.percentTitle}>전체 출석률</Text>
            <View style={styles.percentBar}>
              <View
                style={[
                  styles.percentBarFill,
                  {
                    width: `${percent}%`,
                    backgroundColor: percent >= 80 ? '#22C55E' : percent >= 60 ? '#F59E0B' : '#FF5B5B',
                  },
                ]}
              />
            </View>
            <Text style={styles.percentTarget}>목표: 80% 이상</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {statsData.map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon} size={28} color={stat.color} />
              </View>
              <Text style={styles.statCount}>{stat.count}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.recordsSection}>
          <View style={styles.recordsHeader}>
            <Text style={styles.recordsTitle}>상세 기록</Text>
            <Text style={styles.recordCount}>{records.length}건</Text>
          </View>

          {records.length > 0 ? (
            records.map((r, i) => {
              const statusInfo = getStatusIcon(r.status);
              const date = new Date(r.scheduleDate);
              const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
              const dayStr = date.toLocaleDateString('ko-KR', { weekday: 'short' });

              return (
                <View key={i} style={styles.recordRow}>
                  <View style={styles.recordDateSection}>
                    <Text style={styles.recordDate}>{dateStr}</Text>
                    <Text style={styles.recordDay}>{dayStr}</Text>
                  </View>

                  <View style={styles.recordContent}>
                    <Text style={styles.recordTitle} numberOfLines={1}>{r.scheduleTitle}</Text>
                    <Text style={styles.recordSubtitle}>스터디 일정</Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                    <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{r.status}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#D5D9FF" />
              <Text style={styles.emptyText}>출석 기록이 없습니다</Text>
              <Text style={styles.emptySubText}>스터디에 참여하여 출석을 기록해보세요</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContainer: { flex: 1 },

  // ✅ 커스텀 헤더 스타일
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },

  percentCard: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    elevation: 2,
  },
  percentCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E8EAFF', justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  percentValue: { fontSize: 32, fontWeight: '700', color: '#4C63D2' },
  percentLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  percentInfo: { flex: 1 },
  percentTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  percentBar: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  percentBarFill: { height: '100%', borderRadius: 3 },
  percentTarget: { fontSize: 12, color: '#999' },

  statsContainer: { flexDirection: 'row', marginHorizontal: 12, marginBottom: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  statIconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statCount: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },

  recordsSection: { paddingHorizontal: 12 },
  recordsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  recordsTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  recordCount: { fontSize: 14, fontWeight: '600', color: '#4C63D2', backgroundColor: '#E8EAFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },

  recordRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12, marginVertical: 6, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  recordDateSection: { alignItems: 'center', marginRight: 12, minWidth: 50 },
  recordDate: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  recordDay: { fontSize: 12, color: '#999', marginTop: 2 },
  recordContent: { flex: 1 },
  recordTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  recordSubtitle: { fontSize: 12, color: '#999' },

  statusBadge: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginTop: 16 },
  emptySubText: { fontSize: 13, color: '#999', marginTop: 6, textAlign: 'center' },
});
