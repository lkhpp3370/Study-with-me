import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StudyManagementScreen = ({ navigation, route }) => {
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
      ]
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
          style: "destructive",
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
          }
        }
      ]
    );
  };

  const renderMemberItem = ({ item }) => {
    const isCurrentUserHost = String(item._id) === String(hostId);

    return (
      <View style={styles.memberCard}>
        <View style={[styles.memberAvatar, isCurrentUserHost && styles.hostAvatar]}>
          <Ionicons 
            name={isCurrentUserHost ? "star" : "person"} 
            size={20} 
            color={isCurrentUserHost ? "#FFD700" : "#4C63D2"} 
          />
        </View>

        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              {String(item.username ?? '')}
            </Text>
            {isCurrentUserHost && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>스터디장</Text>
              </View>
            )}
          </View>
        </View>

        {!isCurrentUserHost && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.delegateButton}
              onPress={() => handleDelegateHost(item._id, item.username)}
            >
              <Ionicons name="swap-horizontal" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.delegateButtonText}>위임</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.kickButton}
              onPress={() => handleKickMember(item._id, item.username)}
            >
              <Ionicons name="exit-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.kickButtonText}>퇴출</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  const fetchMembers = useCallback(async () => {
    try {
      const resStudy = await api.get(`/studies/${studyId}`);
      setMembers(resStudy.data.members || []);
    } catch (err) {
      console.error('스터디 멤버 목록 갱신 실패:', err);
    }
  }, [studyId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUserId = await AsyncStorage.getItem('userId');
      
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

  const handleApprove = async (applicationId) => {
    try {
      const currentUserId = await AsyncStorage.getItem('userId');
      await api.patch(`/applications/${applicationId}/approve`, { hostId: currentUserId });
      Alert.alert('승인 완료', '해당 신청을 승인했습니다.');
      
      fetchData(); 
      fetchMembers();
    } catch (err) {
      Alert.alert('실패', err.response?.data?.message || '승인 실패');
      fetchData();
    }
  };

  const handleReject = async (applicationId) => {
    try {
      const currentUserId = await AsyncStorage.getItem('userId');
      await api.patch(`/applications/${applicationId}/reject`, { hostId: currentUserId });
      Alert.alert('거절 완료', '해당 신청을 거절했습니다.');
      fetchData();
    } catch (err) {
      Alert.alert('실패', err.response?.data?.message || '거절 실패');
      fetchData();
    }
  };

  const renderApplicationCard = (app) => (
    <View key={app._id} style={styles.applicationCard}>
      <View style={styles.applicantHeader}>
        <View style={styles.applicantAvatar}>
          <Ionicons name="person-add" size={20} color="#4C63D2" />
        </View>
        <Text style={styles.applicantName}>{app.applicant?.username} 님</Text>
      </View>

      <View style={styles.applicantInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="school" size={14} color="#666" />
          <Text style={styles.infoText}>학년: {app.applicant?.grade || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="book" size={14} color="#666" />
          <Text style={styles.infoText}>전공: {app.applicant?.major || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={14} color="#666" />
          <Text style={styles.infoText}>성별: {app.applicant?.gender || '-'}</Text>
        </View>
        {app.message && (
          <View style={styles.messageBox}>
            <Ionicons name="chatbubble" size={14} color="#4C63D2" />
            <Text style={styles.messageText}>{app.message}</Text>
          </View>
        )}
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => handleApprove(app._id)}
        >
          <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.approveBtnText}>승인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => handleReject(app._id)}
        >
          <Ionicons name="close-circle" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.rejectBtnText}>거절</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{studyName} 관리</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color="#4C63D2" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>스터디원 목록</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{members.length}</Text>
            </View>
          </View>

          {members.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#D5D9FF" />
              <Text style={styles.emptyText}>스터디원이 없습니다</Text>
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item._id}
              renderItem={renderMemberItem}
              scrollEnabled={false}
              contentContainerStyle={styles.memberList}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hourglass" size={20} color="#4C63D2" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>가입 대기 목록</Text>
            {!loading && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{pendingApps.length}</Text>
              </View>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4C63D2" />
              <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
          ) : pendingApps.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color="#D5D9FF" />
              <Text style={styles.emptyText}>가입 대기 신청이 없습니다</Text>
            </View>
          ) : (
            <View style={styles.applicationsList}>
              {pendingApps.map(renderApplicationCard)}
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4C63D2',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  countBadge: {
    backgroundColor: '#4C63D2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  memberList: {
    backgroundColor: '#fff',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8EAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hostAvatar: {
    backgroundColor: '#FFF9E5',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  hostBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hostBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B6914',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  delegateButton: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  delegateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  kickButton: {
    flexDirection: 'row',
    backgroundColor: '#FF5B5B',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  kickButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  applicationsList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: '#fff',
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EAFF',
    borderLeftWidth: 4,
    borderLeftColor: '#4C63D2',
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8EAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  applicantInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F8F9FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: '#1a1a1a',
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#22C55E',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF5B5B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});

export default StudyManagementScreen;