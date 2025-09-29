import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function MonthlyRankingScreen() {
  const [ranking, setRanking] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = async () => {
    try {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const res = await api.get(`/attendance/ranking/${monthStr}`);
      setRanking(res.data);
    } catch (err) {
      console.error('월간 랭킹 불러오기 실패:', err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRanking();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRanking();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.header}>월간 출석률 랭킹</Text>
      {ranking.length > 0 ? (
        ranking.map((r, i) => (
          <View key={i} style={styles.rankRow}>
            <Text style={styles.rankNum}>{i + 1}</Text>
            <Text style={styles.rankStudy}>{r.study}</Text>
            <Text style={styles.rankRate}>{r.출석률}%</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>이번 달 출석 데이터가 없습니다.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 12 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  rankRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  rankNum: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  rankStudy: { flex: 1, fontSize: 16 },
  rankRate: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#aaa' },
});
