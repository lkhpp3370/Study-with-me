import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import api from '../services/api';

const BoardDetail = ({ route, navigation }) => {
  const { postId, studyId, studyName } = route.params || {};
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      Alert.alert('오류', '게시글 정보를 불러올 수 없습니다.');
      navigation.goBack();
      return;
    }
    const fetchPost = async () => {
      try {
        const res = await api.get(`/api/posts/${postId}`);
        setPost(res.data);
      } catch (error) {
        Alert.alert('오류', error.response?.data?.message || '게시글을 불러오지 못했습니다.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d2b40" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text>게시글이 존재하지 않습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{post.title}</Text>
      <View style={styles.infoRow}>
        <Text style={styles.author}>{post.author?.username || '익명'}</Text>
        <Text style={styles.date}>{new Date(post.createdAt).toLocaleString('ko-KR')}</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.content}>{post.content}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  author: { fontSize: 14, color: '#555' },
  date: { fontSize: 13, color: '#888' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  content: { fontSize: 16, color: '#222', lineHeight: 24 },
});

export default BoardDetail;