// front/screens/BoardDetail.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert,
  TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView,
  Platform, Keyboard, InteractionManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlatList } from 'react-native';
import api from '../services/api';

const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textLight: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  danger: '#EF4444',
};

const BoardDetail = ({ route, navigation }) => {
  const { postId, studyHostId } = route.params || {};
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const listRef = useRef(null);

  // ====== Fetch ======
  const fetchPost = async () => {
    try {
      const res = await api.get(`/api/posts/${postId}`);
      setPost(res.data);
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '게시글을 불러오지 못했습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentLoading(true);
      const res = await api.get(`/api/postcomments/post/${postId}`);
      setComments(res.data || []);
    } catch (e) {
      console.error('댓글 조회 실패:', e);
    } finally {
      setCommentLoading(false);
    }
  };

  // ====== Submit ======
  const handleCommentSubmit = async () => {
    const text = newComment.trim();
    if (!text) return Alert.alert('알림', '댓글 내용을 입력해주세요.');

    const userId = currentUserId || await AsyncStorage.getItem('userId');
    if (!userId) return Alert.alert('오류', '로그인 정보가 없습니다.');

    try {
      const res = await api.post(`/api/postcomments/post/${postId}`, {
        content: text,
        authorId: userId,
      });

      setNewComment('');
      Keyboard.dismiss();

      // ✅ InteractionManager로 지연 없이 스크롤
      InteractionManager.runAfterInteractions(() => {
        setComments(prev => [...prev, res.data.comment]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      });
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '댓글 작성 실패');
    }
  };

  // ====== Delete ======
  const handleCommentDelete = (commentId, authorId) => {
    const me = currentUserId?.toString();
    if (authorId?.toString() !== me && studyHostId?.toString() !== me)
      return Alert.alert('권한 없음', '댓글을 삭제할 권한이 없습니다.');

    Alert.alert('댓글 삭제', '정말 이 댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/postcomments/${commentId}`, { data: { userId: me } });
            setComments(prev => prev.filter(c => c._id !== commentId));
          } catch (e) {
            Alert.alert('오류', e.response?.data?.message || '삭제 실패');
          }
        },
      },
    ]);
  };

  // ====== Effect ======
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id);
    })();
  }, []);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  // ✅ 댓글 수 변화 시 자동 스크롤
  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [comments.length]);

  // ====== UI ======
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>게시글을 불러오는 중</Text>
      </View>
    );
  }

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentTop}>
        <View style={styles.commentAuthorInfo}>
          <View style={styles.commentAvatar}>
            <Ionicons name="person" size={14} color={COLORS.primary} />
          </View>
          <Text style={styles.commentAuthor}>{item.author?.username || '익명'}</Text>
        </View>
        {(item.author?._id === currentUserId || studyHostId === currentUserId) && (
          <TouchableOpacity onPress={() => handleCommentDelete(item._id, item.author?._id)}>
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentDate}>
        {new Date(item.createdAt).toLocaleString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // ✅ 오프셋 조정
      >
        <FlatList
          ref={listRef}
          data={comments}
          keyExtractor={item => item._id}
          renderItem={renderCommentItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          ListHeaderComponent={
            <View style={styles.postCard}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <View style={styles.postMeta}>
                <View style={styles.authorInfo}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={16} color={COLORS.primary} />
                  </View>
                  <Text style={styles.authorName}>{post.author?.username || '익명'}</Text>
                </View>
                <View style={styles.dateInfo}>
                  <Ionicons name="time-outline" size={14} color={COLORS.muted} />
                  <Text style={styles.dateText}>
                    {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <Text style={styles.postContent}>{post.content}</Text>
            </View>
          }
        />

        {/* 댓글 입력 */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="댓글을 입력하세요"
              placeholderTextColor={COLORS.muted}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !newComment.trim() && styles.submitButtonDisabled,
            ]}
            onPress={handleCommentSubmit}
            disabled={!newComment.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textLight },
  postCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  postTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' },
  authorName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 13, color: COLORS.muted },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  postContent: { fontSize: 16, lineHeight: 26, color: COLORS.text },

  commentCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  commentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  commentAuthorInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  commentContent: { fontSize: 15, lineHeight: 22, color: COLORS.text, marginBottom: 8 },
  commentDate: { fontSize: 12, color: COLORS.muted },

  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8,
  },
  inputWrapper: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100,
  },
  commentInput: { fontSize: 15, color: COLORS.text, maxHeight: 80 },
  submitButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  submitButtonDisabled: { backgroundColor: COLORS.muted, shadowOpacity: 0 },
});

export default BoardDetail;
