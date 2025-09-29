import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function UserAttendanceScreen() {
  const [records, setRecords] = useState([]);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const fetchUserAttendance = async () => {
      const uid = await AsyncStorage.getItem('userId');
      try {
        const res = await api.get(`/attendance/user/${uid}/detail`);
        setRecords(res.data.records || []);
        setPercent(res.data.percent || 0);
      } catch (err) {
        console.error('내 출석 데이터 불러오기 실패:', err.message);
      }
    };
    fetchUserAttendance();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>내 출석 기록 (총 출석률 {percent}%)</Text>
      {records.length > 0 ? (
        records.map((r, i) => (
          <View key={i} style={styles.recordRow}>
            <Text style={{ flex: 2 }}>{new Date(r.scheduleDate).toLocaleDateString()}</Text>
            <Text style={{ flex: 3 }}>{r.scheduleTitle}</Text>
            <Text style={{ flex: 1, textAlign: 'right', color: r.status === '출석' ? '#007AFF' : r.status === '지각' ? '#FFA500' : '#FF3B30' }}>
              {r.status}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>출석 기록이 없습니다.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 12 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  recordRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
  },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#aaa' },
});
