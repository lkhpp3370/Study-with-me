import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function AttendanceCheckScreen({ navigation }) {
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      const uid = await AsyncStorage.getItem('userId');
      try {
        const res = await api.get(`/attendance/host/${uid}/schedules`);
        setSchedules(res.data || []);
      } catch (err) {
        console.error('내가 개최한 일정 불러오기 실패:', err.message);
      }
    };
    fetchSchedules();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>내가 개최한 일정</Text>
      {schedules.length > 0 ? (
        schedules.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.scheduleRow, { backgroundColor: s.type === 'future' ? '#fff' : '#eee' }]}
            onPress={() => navigation.navigate('AttendanceDetail', { scheduleId: s._id })}
          >
            <Text style={{ flex: 2 }}>{new Date(s.startDate).toLocaleDateString()}</Text>
            <Text style={{ flex: 3 }}>{s.title}</Text>
            {s.type === 'past' ? (
              <Text style={{ flex: 2, textAlign: 'right' }}>
                출석 {s.summary?.출석 ?? 0} / 결석 {s.summary?.결석 ?? 0}
              </Text>
            ) : (
              <Text style={{ flex: 2, textAlign: 'right', color: s.canCheck ? '#007AFF' : '#aaa' }}>
                {s.canCheck ? '체크 가능' : '체크 불가'}
              </Text>
            )}
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>내가 개최한 일정이 없습니다.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 12 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  scheduleRow: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#aaa' },
});
