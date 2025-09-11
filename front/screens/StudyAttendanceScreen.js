import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import api from '../services/api';

export default function StudyAttendanceScreen({ route }) {
  const { studyId, studyTitle } = route.params;
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchStudyAttendance = async () => {
      try {
        const res = await api.get(`/attendance/study/${studyId}/members`);
        setMembers(res.data.members || []);
      } catch (err) {
        console.error('스터디 출석 데이터 불러오기 실패:', err.message);
      }
    };
    fetchStudyAttendance();
  }, [studyId]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{studyTitle} 출석 현황</Text>
      {members.length > 0 ? (
        members.map((m, i) => (
          <View key={i} style={styles.recordRow}>
            <Text style={{ flex: 2 }}>{m.username}</Text>
            <Text style={{ flex: 1, textAlign: 'right', fontWeight: '600' }}>{m.percent}%</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>출석 데이터가 없습니다.</Text>
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
