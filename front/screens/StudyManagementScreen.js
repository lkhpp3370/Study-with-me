import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ActivityIndicator, // <--- ActivityIndicator 추가
  ScrollView, // <--- ScrollView 추가
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StudyManagementScreen = ({ navigation, route }) => {
  // 안전하게 기본값 지정
  const { studyId = '', studyName = '', members: initialMembers = [], hostId = '' } = route.params || {};
  const [members, setMembers] = useState(Array.isArray(initialMembers) ? initialMembers : []);
  const [pendingApps, setPendingApps] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDelegateHost = (newHostId, newHostName) => {
    Alert.alert(
      "스터디장 위임",
      `정말로 ${newHostName}님에게 스터디장 권한을 위임하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "위임",
          onPress: async () => {
            try {
              const currentUserId = await AsyncStorage.getItem('userId');
              await api.patch(`/studies/${studyId}/delegate-host`, {
                newHostId,
                currentUserId 
              });

              Alert.alert('알림', `${newHostName}님에게 스터디장 권한이 위임되었습니다.`, [
                { text: '확인', onPress: () => navigation.goBack() } 
              ]);
            } catch (error) {
              console.error('스터디장 위임 실패:', error);
              Alert.alert('오류', '스터디장 위임에 실패했습니다.');
            }
          }
        }
      ],
      { cancelable: false }
    );
  };

  const handleKickMember = (memberId, memberName) => {
    Alert.alert(
      "스터디원 퇴출",
      `정말로 ${memberName}님을 스터디에서 퇴출시키겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "퇴출",
          onPress: async () => {
            try {
              const response = await api.delete(`/studies/${studyId}/members/${memberId}`);
              setMembers(prev => prev.filter(m => String(m._id) !== String(memberId)));
              
              if (response?.data?.message && response.data.message.includes('스터디가 삭제되었습니다.')) {
                Alert.alert('알림', response.data.message, [{ text: '확인', onPress: () => navigation.pop(2) }]);
              } else {
                Alert.alert('알림', `${memberName}님을 성공적으로 퇴출시켰습니다.`);
              }
            } catch (error) {
              console.error('스터디원 퇴출 실패:', error);
              Alert.alert('오류', '스터디원 퇴출에 실패했습니다.');
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: false }
    );
  };

  const renderMemberItem = ({ item }) => {
    // 안전하게 문자열 비교
    const isCurrentUserHost = String(item._id) === String(hostId);

    return (
      <View style={styles.memberItem}>
        <Ionicons name="person-circle-outline" size={24} color="#555" />

        {/* username과 host 라벨을 분리된 Text로 렌더링(문자열이 View에 직접 노출되는 것을 방지) */}
        <View style={{ marginLeft: 10, flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.memberName} numberOfLines={1}>
            {String(item.username ?? '')}
          </Text>
          {isCurrentUserHost && (
            <Text style={styles.hostText}> (스터디장)</Text>
          )}
        </View>

        {!isCurrentUserHost && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.delegateButton]}
              onPress={() => handleDelegateHost(item._id, item.username)}
            >
              <Text style={styles.delegateButtonText}>위임</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.kickButton]}
              onPress={() => handleKickMember(item._id, item.username)}
            >
              <Text style={styles.kickButtonText}>퇴출</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  const fetchMembers = useCallback(async () => {
      try {
          // Study 상세 정보를 불러오는 API (예시: /studies/:studyId)를 사용해야 합니다.
          // 이 API가 Study 객체 전체(members 배열 포함)를 반환한다고 가정합니다.
          const resStudy = await api.get(`/studies/${studyId}`);
          
          // 반환된 데이터에서 최신 members 배열을 가져와 상태를 업데이트합니다.
          setMembers(resStudy.data.members || []);
      } catch (err) {
          console.error('❌ 스터디 멤버 목록 갱신 실패:', err);
      }
  }, [studyId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUserId = await AsyncStorage.getItem('userId');
      
      // 1. 가입 대기 신청 목록 불러오기
      const pendingRes = await api.get(`/applications/${studyId}/pending`, {
        params: { hostId: currentUserId },
      });
      setPendingApps(pendingRes.data);
    } catch (err) {
      Alert.alert('실패', err.response?.data?.message || '데이터 불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [studyId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 가입 승인
  const handleApprove = async (applicationId) => {
    try {
      const currentUserId = await AsyncStorage.getItem('userId');
      await api.patch(`/applications/${applicationId}/approve`, { hostId: currentUserId });
      Alert.alert('승인 완료', '해당 신청을 승인했습니다.');
      
      // 승인 후 목록 갱신
      fetchData(); 
      fetchMembers();
    } catch (err) {
      Alert.alert('실패', err.response?.data?.message || '승인 실패');
      fetchData(); // 에러 발생 시 목록 갱신 시도
    }
  };

  // 가입 거절
  const handleReject = async (applicationId) => {
    try {
      const currentUserId = await AsyncStorage.getItem('userId');
      await api.patch(`/applications/${applicationId}/reject`, { hostId: currentUserId });
      Alert.alert('거절 완료', '해당 신청을 거절했습니다.');
      fetchData(); // 목록 갱신
    } catch (err) {
      Alert.alert('실패', err.response?.data?.message || '거절 실패');
      fetchData(); // 에러 발생 시 목록 갱신 시도
    }
  };
// ⭐ 가입 대기 카드 렌더링 함수
  const renderApplicationCard = (app) => (
    <View key={app._id} style={styles.applicationCard}>
      <Text style={styles.applicantName}>{app.applicant?.username} 님</Text>
      <Text>학년: {app.applicant?.grade || '-'}</Text>
      <Text>전공: {app.applicant?.major || '-'}</Text>
      <Text>성별: {app.applicant?.gender || '-'}</Text>
      {app.message ? <Text>메시지: {app.message}</Text> : null}

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: 'green' }]}
          onPress={() => handleApprove(app._id)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>승인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: 'red' }]}
          onPress={() => handleReject(app._id)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>거절</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{studyName} 관리</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* 💥 전체 화면을 ScrollView로 감싸 멤버 목록과 대기 목록을 모두 표시 */}
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* 1. 기존 스터디원 목록 섹션 */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>스터디원 목록 ({members.length}명)</Text>
          </View>
          <FlatList
            data={members}
            keyExtractor={(item) => item._id}
            renderItem={renderMemberItem}
            ListEmptyComponent={<Text style={styles.emptyText}>스터디원 없음</Text>}
            scrollEnabled={false} // ⭐ ScrollView 내부이므로 스크롤 비활성화
          />
          
          {/* 섹션 구분선 */}
          <View style={styles.separator} />

          {/* 2. ⭐ 새로운 가입 대기 목록 섹션 */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>가입 대기 목록 ({loading ? '로딩 중...' : `${pendingApps.length}명`})</Text>
          </View>
          <View style={styles.listContent}>
            {loading ? (
              <ActivityIndicator size="large" color="#001f3f" style={{ paddingVertical: 20 }} />
            ) : pendingApps.length === 0 ? (
              <Text style={styles.emptyText}>가입 대기 신청이 없습니다.</Text>
            ) : (
              pendingApps.map(renderApplicationCard) // 대기 목록 카드 렌더링
            )}
          </View>
          
        </ScrollView>
      </View>
    );
  };


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#001f3f',
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  listHeader: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  listContent: { paddingHorizontal: 15 },
  memberItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  memberName: { fontSize: 16, flexShrink: 1 }, // flex 대신 flexShrink로 안정화
  hostText: { color: '#00adf5', fontWeight: 'bold', fontSize: 14 },
  buttonContainer: { flexDirection: 'row', marginLeft: 'auto' },
  actionButton: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, marginLeft: 8 },
  delegateButton: { backgroundColor: '#00adf5' },
  delegateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  kickButton: { backgroundColor: '#dc3545' },
  kickButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#777' },
  scrollContent: { 
    paddingBottom: 20 
  },
  separator: { 
    height: 10, 
    backgroundColor: '#f5f6f7' 
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  applicantName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 5,
    color: '#001f3f'
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
    gap: 10,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
});

export default StudyManagementScreen;
