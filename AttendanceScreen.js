import React, { useState, useLayoutEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

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
          style={{ marginRight: 15 }}
        >
          <Ionicons name="checkmark-done-circle" size={26} color="#007AFF" />
        </TouchableOpacity>
      ),
      headerShown: true,
      title: '출석률',
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
        { name: '출석', count: userAttendance.summary.출석, color: '#007AFF', legendFontColor: '#333', legendFontSize: 13 },
        { name: '지각', count: userAttendance.summary.지각, color: '#FFA500', legendFontColor: '#333', legendFontSize: 13 },
        { name: '결석', count: userAttendance.summary.결석, color: '#FF3B30', legendFontColor: '#333', legendFontSize: 13 },
      ]
    : [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.subHeader}>월간 출석률 랭킹</Text>
      {ranking.length > 0 ? (
        ranking.slice(0, 3).map((r, i) => (
          <TouchableOpacity key={i} style={styles.rankRow} onPress={() => navigation.navigate('MonthlyRanking')}>
            <Text style={styles.rankNum}>{i + 1}</Text>
            <Text style={styles.rankStudy}>{r.study}</Text>
            <Text style={styles.rankRate}>{r.출석률}%</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>이번 달 출석률 데이터가 없습니다.</Text>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('UserAttendance')}>
        <Text style={styles.subHeader}>내 전체 출석률 ({userAttendance?.percent ?? 0}%)</Text>
        {userAttendance ? (
          <PieChart
            data={pieData}
            width={screenWidth - 16}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              labelColor: () => '#333',
            }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        ) : (
          <Text style={styles.emptyText}>전체 출석 데이터가 없습니다.</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.subHeader}>스터디별 출석률</Text>
      {studyAttendance.length > 0 ? (
        studyAttendance.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={styles.tableRow}
            onPress={() => navigation.navigate('StudyAttendance', { studyId: s._id, studyTitle: s.study })}
          >
            <Text style={{ flex: 2 }}>{s.study}</Text>
            <Text style={{ flex: 1, textAlign: 'right', fontWeight: '600' }}>{s.percent}%</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>스터디별 출석 데이터가 없습니다.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 8 },
  subHeader: { fontSize: 16, fontWeight: '600', marginTop: 14, marginBottom: 6, marginLeft: 6 },
  emptyText: { textAlign: 'center', marginVertical: 10, color: '#aaa' },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  rankRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  rankNum: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  rankStudy: { flex: 1, fontSize: 16 },
  rankRate: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
});
