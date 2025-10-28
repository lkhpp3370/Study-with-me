//수정완료
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function StudyAttendanceScreen({ route }) {
  const { studyId, studyTitle } = route.params;
  const [members, setMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // ✅ 네이티브 헤더 숨기기
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchStudyAttendance = async () => {
    try {
      const res = await api.get(`/attendance/study/${studyId}/members`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('스터디 출석 데이터 불러오기 실패:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyAttendance();
  }, [studyId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudyAttendance();
    setRefreshing(false);
  };

  const getAttendanceColor = (percent) => {
    if (percent >= 80) return { color: '#22C55E', bgColor: '#ECFDF5' };
    if (percent >= 60) return { color: '#F59E0B', bgColor: '#FFFBEB' };
    return { color: '#FF5B5B', bgColor: '#FEF2F2' };
  };

  const getAttendanceIcon = (percent) => {
    if (percent >= 80) return 'checkmark-circle';
    if (percent >= 60) return 'alert-circle';
    return 'close-circle';
  };

  const avgAttendance =
    members.length > 0
      ? Math.round(members.reduce((sum, m) => sum + m.percent, 0) / members.length)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ 커스텀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4C63D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>출석 현황</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.studyTitle}>{studyTitle}</Text>
          <Text style={styles.subtitle}>스터디 멤버 출석률</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={24} color="#4C63D2" style={{ marginBottom: 8 }} />
            <Text style={styles.statLabel}>총 멤버</Text>
            <Text style={styles.statValue}>{members.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="pulse-outline" size={24} color="#4C63D2" style={{ marginBottom: 8 }} />
            <Text style={styles.statLabel}>평균 출석률</Text>
            <Text style={styles.statValue}>{avgAttendance}%</Text>
          </View>
        </View>

        <View style={styles.memberSection}>
          <Text style={styles.sectionTitle}>멤버별 출석률</Text>
          {members.length > 0 ? (
            <View style={styles.memberList}>
              {members.map((m, i) => {
                const attendance = getAttendanceColor(m.percent);
                const icon = getAttendanceIcon(m.percent);
                const isTop = i < 3;

                return (
                  <View
                    key={i}
                    style={[styles.memberCard, isTop && styles.memberCardTop]}
                  >
                    <View style={styles.memberRank}>
                      {isTop ? (
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankText}>{i + 1}</Text>
                        </View>
                      ) : (
                        <View style={styles.rankNumberContainer}>
                          <Text style={styles.rankNumber}>{i + 1}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{m.username}</Text>
                      <View style={styles.attendanceBar}>
                        <View
                          style={[
                            styles.attendanceBarFill,
                            { width: `${m.percent}%`, backgroundColor: attendance.color },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.memberPercentContainer}>
                      <View style={[styles.percentBadge, { backgroundColor: attendance.bgColor }]}>
                        <Ionicons name={icon} size={16} color={attendance.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.percentText, { color: attendance.color }]}>{m.percent}%</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#D5D9FF" />
              <Text style={styles.emptyText}>출석 데이터가 없습니다</Text>
              <Text style={styles.emptySubText}>스터디에 참여하여 출석을 기록해보세요</Text>
            </View>
          )}
        </View>

        <View style={styles.legendSection}>
          <Text style={styles.legendTitle}>출석률 가이드</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>80% 이상: 우수</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>60~79%: 양호</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF5B5B' }]} />
            <Text style={styles.legendText}>60% 미만: 저조</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContainer: { flex: 1 },

  // ✅ 커스텀 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },

  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  studyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#999', fontWeight: '500' },

  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statDivider: { width: 1, backgroundColor: '#F0F0F0' },
  statLabel: { fontSize: 12, color: '#999', fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#4C63D2' },

  memberSection: { paddingHorizontal: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, marginLeft: 4 },
  memberList: { gap: 10 },

  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  memberCardTop: { backgroundColor: '#F8F9FF', borderColor: '#E8EAFF', borderLeftWidth: 4, borderLeftColor: '#4C63D2' },

  memberRank: { marginRight: 14 },
  rankBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4C63D2', justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  rankNumberContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  rankNumber: { fontSize: 14, fontWeight: '600', color: '#999' },

  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  attendanceBar: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  attendanceBarFill: { height: '100%', borderRadius: 3 },

  memberPercentContainer: { marginLeft: 12 },
  percentBadge: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  percentText: { fontSize: 13, fontWeight: '700' },

  legendSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  legendTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  legendText: { fontSize: 13, color: '#666', fontWeight: '500' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginTop: 16 },
  emptySubText: { fontSize: 13, color: '#999', marginTop: 6, textAlign: 'center' },
});
