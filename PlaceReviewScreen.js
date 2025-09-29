// screens/PlaceReviewScreen.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '@env';

function Star({ filled, size = 20, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
      <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color="#f5a524" />
    </TouchableOpacity>
  );
}

export default function PlaceReviewScreen({ route, navigation }) {
  const { placeId, placeName = '장소' } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const fetchReviews = async () => {
    if (!placeId) return;
    try {
      setLoading(true);
      // GET /reviews/place/:placeId
      const res = await axios.get(`${BACKEND_URL}/reviews/place/${placeId}`);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      Alert.alert('불러오기 실패', '리뷰 목록을 가져오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!placeId) return;
    if (myRating < 1) {
      Alert.alert('알림', '별점을 선택해주세요.');
      return;
    }
    try {
      setSubmitting(true);
      // POST /reviews/place/:placeId
      await axios.post(`${BACKEND_URL}/reviews/place/${placeId}`, {
        // 실제 로그인 유저 ID로 바꿔 연결하면 좋음
        userId: 'tester',
        rating: myRating,
        comment: myComment.trim(),
      });
      setMyRating(0);
      setMyComment('');
      fetchReviews();
      Alert.alert('완료', '리뷰가 등록되었습니다.');
    } catch (e) {
      Alert.alert('실패', '리뷰 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: `${placeName} 리뷰` });
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* 헤더: 평균 평점 + 개수 */}
      <View style={styles.header}>
        <Text style={styles.title}>{placeName}</Text>
        <View style={styles.avgRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <Ionicons
              key={n}
              name={avgRating >= n ? 'star' : avgRating >= n - 0.5 ? 'star-half' : 'star-outline'}
              size={18}
              color="#f5a524"
              style={{ marginRight: 2 }}
            />
          ))}
          <Text style={styles.avgText}>
            {avgRating.toFixed(1)}점 · {reviews.length}개 리뷰
          </Text>
        </View>
      </View>

      {/* 작성 영역 */}
      <View style={styles.editor}>
        <Text style={styles.sectionTitle}>리뷰 쓰기</Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} filled={myRating >= n} size={26} onPress={() => setMyRating(n)} />
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="장소 이용 경험을 남겨주세요 (선택)"
          value={myComment}
          onChangeText={setMyComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={submitReview}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator /> : <Text style={styles.submitText}>등록</Text>}
        </TouchableOpacity>
      </View>

      {/* 목록 */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>리뷰 목록</Text>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item, idx) => item._id || String(idx)}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Ionicons
                        key={n}
                        name={item.rating >= n ? 'star' : 'star-outline'}
                        size={16}
                        color="#f5a524"
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>
                  <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ color: '#666', padding: 16 }}>등록된 리뷰가 없습니다.</Text>
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 6 },
  avgRow: { flexDirection: 'row', alignItems: 'center' },
  avgText: { marginLeft: 8, color: '#333', fontWeight: '600' },

  editor: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  starRow: { flexDirection: 'row', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, minHeight: 80, textAlignVertical: 'top'
  },
  submitBtn: {
    marginTop: 10, backgroundColor: '#1f6feb', borderRadius: 10, paddingVertical: 12, alignItems: 'center'
  },
  submitText: { color: '#fff', fontWeight: '700' },

  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dateText: { color: '#888', fontSize: 12 },
  comment: { color: '#222' },
});
