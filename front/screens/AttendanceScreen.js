//수정완료
import React, { useState, useLayoutEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textLight: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  gold: '#FBBF24',
  silver: '#9CA3AF',
  bronze: '#D97706',
};

export default function AttendanceScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [userAttendance, setUserAttendance] = useState(null);
  const [studyAttendance, setStudyAttendance] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AttendanceCheck')}
          style={styles.headerButton}
        >
          <Ionicons name="checkmark-done-circle" size={26} color={COLORS.primary} />
        </TouchableOpacity>
      ),
      headerShown: true,
      title: '출석률',
      headerStyle: { backgroundColor: COLORS.card },
      headerTitleStyle: { fontWeight: '700', color: COLORS.text },
    });
  }, [navigation]);

  const fetchData = async () => {
    const uid = await AsyncStorage.getItem('userId');
    setUserId(uid);
    try {
      const userRes = await api.get(`/attendance/user/${uid}/detail`);
      setUserAttendance(userRes.data);

      const studiesRes = await api.get(`/main/${uid}`);
      const studies = studiesRes.data?.studies ?? [];

      const studyResults = await Promise.all(
        studies.map(async (s) => {
          const res = await api.get(`/attendance/study/${s._id}/members`);
          return { _id: s._id, study: s.title, percent: res.data.members.find(m => m.userId === uid)?.percent || 0 };
        })
      );
      setStudyAttendance(studyResults);

      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const rankRes = await api.get(`/attendance/ranking/${monthStr}`);
      setRanking(rankRes.data);
    } catch (err) {
      console.error('출석률 데이터 불러오기 실패:', err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const pieData = userAttendance
    ? [
        { name: '출석', count: userAttendance.summary.출석, color: COLORS.success, legendFontColor: COLORS.text, legendFontSize: 13 },
        { name: '지각', count: userAttendance.summary.지각, color: COLORS.warning, legendFontColor: COLORS.text, legendFontSize: 13 },
        { name: '결석', count: userAttendance.summary.결석, color: COLORS.danger, legendFontColor: COLORS.text, legendFontSize: 13 },
      ]
    : [];

  const getRankColor = (rank) => {
    if (rank === 1) return COLORS.gold;
    if (rank === 2) return COLORS.silver;
    if (rank === 3) return COLORS.bronze;
    return COLORS.muted;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return 'trophy';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'medal-outline';
    return 'ribbon-outline';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 월간 랭킹 섹션 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="podium" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>월간 출석률 랭킹</Text>
        </View>

        {ranking.length > 0 ? (
          <View style={styles.rankingCard}>
            {ranking.slice(0, 3).map((r, i) => (
              <TouchableOpacity
                key={i}
                style={styles.rankRow}
                onPress={() => navigation.navigate('MonthlyRanking')}
                activeOpacity={0.7}
              >
                <View style={styles.rankLeft}>
                  <View style={[styles.rankBadge, { backgroundColor: `${getRankColor(i + 1)}20` }]}>
                    <Ionicons name={getRankIcon(i + 1)} size={20} color={getRankColor(i + 1)} />
                  </View>
                  <Text style={styles.rankStudy}>{r.study}</Text>
                </View>
                <View style={styles.rankRight}>
                  <Text style={styles.rankRate}>{r.출석률}%</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={40} color={COLORS.muted} />
            <Text style={styles.emptyText}>이번 달 출석률 데이터가 없습니다</Text>
          </View>
        )}
      </View>

      {/* 내 전체 출석률 섹션 */}
      <TouchableOpacity
        style={styles.section}
        onPress={() => navigation.navigate('UserAttendance')}
        activeOpacity={0.9}
      >
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>내 전체 출석률</Text>
          <View style={styles.percentBadge}>
            <Text style={styles.percentBadgeText}>{userAttendance?.percent ?? 0}%</Text>
          </View>
        </View>

        {userAttendance ? (
          <View style={styles.chartCard}>
            <PieChart
              data={pieData}
              width={screenWidth - 64}
              height={200}
              chartConfig={{
                backgroundColor: COLORS.card,
                backgroundGradientFrom: COLORS.card,
                backgroundGradientTo: COLORS.card,
                color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                labelColor: () => COLORS.text,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="0"
              hasLegend={true}
            />
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.statLabel}>출석</Text>
                <Text style={styles.statValue}>{userAttendance.summary.출석}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.statLabel}>지각</Text>
                <Text style={styles.statValue}>{userAttendance.summary.지각}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.danger }]} />
                <Text style={styles.statLabel}>결석</Text>
                <Text style={styles.statValue}>{userAttendance.summary.결석}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="stats-chart-outline" size={40} color={COLORS.muted} />
            <Text style={styles.emptyText}>전체 출석 데이터가 없습니다</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 스터디별 출석률 섹션 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>스터디별 출석률</Text>
        </View>

        {studyAttendance.length > 0 ? (
          <View style={styles.studyListCard}>
            {studyAttendance.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.studyRow}
                onPress={() => navigation.navigate('StudyAttendance', { studyId: s._id, studyTitle: s.study })}
                activeOpacity={0.7}
              >
                <View style={styles.studyLeft}>
                  <View style={styles.studyIcon}>
                    <Ionicons name="book" size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.studyName}>{s.study}</Text>
                </View>
                <View style={styles.studyRight}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${s.percent}%` }]} />
                  </View>
                  <Text style={styles.studyPercent}>{s.percent}%</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={40} color={COLORS.muted} />
            <Text style={styles.emptyText}>스터디별 출석 데이터가 없습니다</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerButton: {
    marginRight: 12,
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  percentBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  rankingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankStudy: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  rankRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankRate: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  studyListCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  studyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },
  studyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  studyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studyName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  studyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  studyPercent: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 45,
    textAlign: 'right',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 12,
    textAlign: 'center',
  },
});