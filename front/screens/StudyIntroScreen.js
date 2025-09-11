// screens/StudyIntroScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StudyIntroScreen({ route, navigation }) {
  const { study } = route.params || {}; // 검색에서 넘어온 study 정보
  const [comment, setComment] = useState('');

  // ⭐ 별점 표시용 컴포넌트
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={18}
          color="#FFD700"
          style={{ marginHorizontal: 1 }}
        />
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 상단 스터디 제목 */}
      <View style={styles.header}>
        <Text style={styles.title}>{study?.title || '스터디 이름'}</Text>
        <Text style={styles.leader}>👤 {study?.leaderName || 'leader_name'}</Text>
      </View>

      {/* 스터디 소개글 */}
      <Text style={styles.description}>
        {study?.description || '저희 스터디는 ~~~ 이런 스터디입니다. 많은 신청 부탁드립니다.'}
      </Text>

      {/* 카테고리/인원/개설일 */}
      <View style={styles.infoBox}>
        <View style={styles.tagRow}>
          <Text style={styles.tag}>{study?.duration || '자유'}</Text>
          <Text style={styles.tag}>{study?.category || '취업'}</Text>
        </View>
        <Text style={styles.infoText}>인원 : {study?.members?.length || 0} / {study?.capacity || '00'}</Text>
        <Text style={styles.infoText}>스터디 개설일 : {study?.createdAt?.slice(0,10) || '20##/##/##'}</Text>
        <Text style={styles.infoText}>이번달 출석 랭킹 : {study?.rank || '34위'}</Text>
      </View>

      {/* 평점 */}
      <View style={styles.ratingBox}>
        <Text style={styles.ratingLabel}>스터디 평점</Text>
        {renderStars(3)}{/* 기본 3점 */}
      </View>

      {/* 댓글 */}
      <Text style={styles.sectionTitle}>댓글</Text>
      <View style={styles.commentBox}>
        <Text style={styles.commentPlaceholder}>사용자가 작성한 비밀 댓글입니다.</Text>
        <Text style={styles.commentPlaceholder}>사용자가 작성한 비밀 댓글입니다.</Text>
      </View>

      {/* 댓글 입력 */}
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="댓글 달기"
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity style={styles.commentBtn}>
          <Text style={{ color: 'white' }}>작성</Text>
        </TouchableOpacity>
      </View>

      {/* 가입 신청 버튼 */}
      <TouchableOpacity style={styles.joinBtn}>
        <Text style={styles.joinText}>가입 신청</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold' },
  leader: { fontSize: 14, color: '#555', marginTop: 4 },
  description: { fontSize: 14, color: '#333', marginBottom: 16 },
  infoBox: { marginBottom: 16 },
  tagRow: { flexDirection: 'row', marginBottom: 6 },
  tag: {
    backgroundColor: '#e0f0ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    fontSize: 12,
  },
  infoText: { fontSize: 13, color: '#444', marginTop: 2 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  ratingLabel: { marginRight: 8, fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  commentBox: { marginBottom: 12 },
  commentPlaceholder: {
    fontSize: 13,
    color: '#777',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
  },
  commentBtn: { backgroundColor: '#003366', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6 },
  joinBtn: {
    backgroundColor: '#003366',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  joinText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
