import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '../services/api';

export default function ReviewScreen({ route }) {
  const { studyId, userId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const renderStars = (rating, onSelect) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onSelect && onSelect(i)}>
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={22}
            color="#FFD700"
            style={{ marginHorizontal: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/reviews/${studyId}?userId=${userId}`);
      setReviews(res.data.reviews);
      setAvgRating(res.data.average);
      if (res.data.myReview) {
        setMyReview(res.data.myReview);
        setRating(res.data.myReview.rating);
        setComment(res.data.myReview.comment);
      }
    } catch (err) {
      console.error('❌ 리뷰 불러오기 실패:', err.message);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSave = async () => {
    if (!rating) {
      Alert.alert('알림', '별점을 선택하세요.');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/reviews/${studyId}`, { userId, rating, comment });
      Alert.alert('완료', myReview ? '리뷰가 수정되었습니다.' : '리뷰가 작성되었습니다.');
      fetchReviews(); // ✅ 저장 후 목록 새로고침
    } catch (err) {
      Alert.alert('실패', err.response?.data?.message || '리뷰 저장 실패');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BACKEND_URL}/reviews/${myReview._id}`, { data: { userId } });
      Alert.alert('완료', '리뷰가 삭제되었습니다.');
      setMyReview(null);
      setRating(0);
      setComment('');
      fetchReviews(); // ✅ 삭제 후 목록 새로고침
    } catch (err) {
      Alert.alert('실패', err.response?.data?.message || '리뷰 삭제 실패');
    }
  };

  const handleRecommend = async (reviewId) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/recommend`, { userId });
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, recommends: Array(res.data.recommends).fill('x') } : r
        )
      );
    } catch (err) {
      console.error('❌ 추천 실패:', err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avgBox}>
        <Text style={styles.avgLabel}>평균 평점</Text>
        {renderStars(avgRating)}
        <Text style={{ marginLeft: 6 }}>({avgRating})</Text>
      </View>

      <View style={styles.myReviewBox}>
        <Text style={styles.sectionTitle}>내 리뷰</Text>
        {renderStars(rating, setRating)}
        <TextInput
          style={styles.input}
          placeholder="리뷰를 작성하세요"
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={{ color: 'white' }}>{myReview ? '수정' : '작성'}</Text>
        </TouchableOpacity>
        {myReview && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={{ color: 'white' }}>삭제</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>모든 리뷰</Text>
      {reviews.map((r) => (
        <View key={r._id} style={styles.reviewCard}>
          <Text style={{ fontWeight: 'bold' }}>{r.user.username}</Text>
          {renderStars(r.rating)}
          <Text>{r.comment}</Text>
          <TouchableOpacity onPress={() => handleRecommend(r._id)}>
            <Text style={{ marginTop: 4 }}>👍 {r.recommends?.length || 0}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  avgBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avgLabel: { fontWeight: 'bold', marginRight: 6 },
  myReviewBox: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginVertical: 8 },
  saveBtn: { backgroundColor: '#003366', padding: 10, borderRadius: 6, alignItems: 'center', marginVertical: 4 },
  deleteBtn: { backgroundColor: 'red', padding: 10, borderRadius: 6, alignItems: 'center' },
  reviewCard: { padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 10 },
});


