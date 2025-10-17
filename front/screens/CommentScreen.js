import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '../services/api';

export default function CommentScreen({ route }) {
  const { studyId, userId } = route.params;
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/comments/${studyId}?viewerId=${userId}`
      );
      setComments(res.data);
    } catch (err) {
      console.error('❌ 댓글 불러오기 실패:', err.message);
    }
  };

  const fetchHost = async () => {
    try {
      const resStudy = await axios.get(`${BACKEND_URL}/studies/${studyId}`);
      const hostId = resStudy.data?.host?._id || resStudy.data?.host;
      setIsHost(String(hostId) === String(userId));
    } catch (err) {
      // 호스트 조회 실패해도 기능은 계속
    }
  };

  useEffect(() => {
    fetchComments();
    fetchHost();
  }, []);

  const handleAddComment = async () => {
    if (!content.trim()) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/comments/${studyId}`, {
        userId,
        content,
        isSecret,
      });
      setComments([res.data, ...comments]);
      setContent('');
      setIsSecret(false);
    } catch (err) {
      console.error('❌ 댓글 작성 실패:', err.message);
      Alert.alert('실패', '댓글 작성 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${BACKEND_URL}/comments/${commentId}`, {
        data: { userId },
      });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      Alert.alert('삭제 완료', '댓글이 삭제되었습니다.'); // ✅ 성공 알림
    } catch (err) {
      Alert.alert('실패', '댓글 삭제 권한이 없거나 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        {comments.map((c) => (
          <View key={c._id} style={styles.commentCard}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontWeight: 'bold' }}>{c.user.username}</Text>
              <Text>{c.content}</Text>
            </View>
            {(String(c.user._id) === String(userId) || isHost) && (
              <TouchableOpacity onPress={() => handleDeleteComment(c._id)}>
                <Ionicons name="trash" size={18} color="red" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="댓글 입력"
          value={content}
          onChangeText={setContent}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddComment}>
          <Text style={{ color: 'white' }}>작성</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.secretRow}>
        <Text style={{ fontSize: 12 }}>비밀댓글</Text>
        <Switch value={isSecret} onValueChange={setIsSecret} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  commentCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
  },
  addBtn: {
    backgroundColor: '#003366',
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginLeft: 6,
    borderRadius: 6,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
});

