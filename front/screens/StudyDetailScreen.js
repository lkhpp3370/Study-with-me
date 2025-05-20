import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../services/api';

const StudyDetailScreen = () => {
  const route = useRoute();
  const { study, studyId } = route.params || {}; // study 또는 studyId 중 하나 받을 수 있도록

  const [studyData, setStudyData] = useState(study || null);
  const [loading, setLoading] = useState(!study);

  useEffect(() => {
    const fetchStudy = async () => {
      if (!study && studyId) {
        try {
          const res = await api.get(`/studies/${studyId}`);
          setStudyData(res.data);
        } catch (err) {
          console.error('스터디 정보 불러오기 실패:', err.message);
          Alert.alert('오류', '스터디 정보를 불러오지 못했습니다.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchStudy();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!studyData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>스터디 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{studyData.title}</Text>
      <Text style={styles.description}>{studyData.description}</Text>
      <Text style={styles.info}>스터디 ID: {studyData._id}</Text>
    </View>
  );
};

export default StudyDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  description: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 10 },
  info: { fontSize: 14, color: '#999' },
  errorText: { fontSize: 16, color: 'red' }
});
