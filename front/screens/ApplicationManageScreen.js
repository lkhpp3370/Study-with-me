import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { BACKEND_URL } from '../services/api';

export default function ApplicationManageScreen({ route }) {
  const { studyId, userId } = route.params; // hostId == userId
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/applications/${studyId}/pending`, {
        params: { hostId: userId },
      });
      setApps(res.data);
    } catch (err) {
      Alert.alert('실패', err.response?.data?.message || '신청 목록 불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (applicationId) => {
    try {
      await axios.patch(`${BACKEND_URL}/applications/${applicationId}/approve`, { hostId: userId });
      Alert.alert('승인 완료', '해당 신청을 승인했습니다.');
      fetchPending();
    } catch (err) {
      Alert.alert('오류', err.response?.data?.message || '승인 실패');
    }
  };

  const handleReject = async (applicationId) => {
    try {
      await axios.patch(`${BACKEND_URL}/applications/${applicationId}/reject`, { hostId: userId });
      Alert.alert('거절 완료', '해당 신청을 거절했습니다.');
      fetchPending();
    } catch (err) {
      Alert.alert('오류', err.response?.data?.message || '거절 실패');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>가입 신청 관리</Text>
      {apps.length === 0 ? (
        <Text style={styles.emptyText}>대기 중인 신청이 없습니다.</Text>
      ) : (
        apps.map((app) => (
          <View key={app._id} style={styles.card}>
            <Text style={styles.username}>신청자: {app.applicant?.username}</Text>
            <Text>학년: {app.applicant?.grade || '-'}</Text>
            <Text>전공: {app.applicant?.major || '-'}</Text>
            <Text>성별: {app.applicant?.gender || '-'}</Text>
            {app.message ? <Text>메시지: {app.message}</Text> : null}

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: 'green' }]}
                onPress={() => handleApprove(app._id)}
              >
                <Text style={{ color: 'white' }}>승인</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: 'red' }]}
                onPress={() => handleReject(app._id)}
              >
                <Text style={{ color: 'white' }}>거절</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  emptyText: { fontSize: 14, color: '#666' },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  username: { fontWeight: 'bold', marginBottom: 4 },
  btnRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  btn: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
});
