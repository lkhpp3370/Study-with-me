// screens/Studyroommain.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, RefreshControl } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import StudyMenu from './StudyMenu';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useFocusEffect } from '@react-navigation/native';

LocaleConfig.locales['ko'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'ko';

const Studyroommain = ({ navigation, route }) => {
  const { studyId, studyName } = route.params;
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [files, setFiles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [studyInfo, setStudyInfo] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const handleLeaveStudy = async () => {
    if (isHost) {
      Alert.alert("경고","방장은 스터디를 나가기 전에 다른 스터디원에게 방장 권한을 위임해야 합니다.",[{ text: "확인" }]);
      return;
    }
    try {
      const currentUserId = await AsyncStorage.getItem('userId');
      if (!currentUserId) {
        Alert.alert('오류', '로그인 상태를 확인해주세요.');
        return;
      }
      await api.delete(`/studies/${studyId}/members/${currentUserId}`);
      Alert.alert('알림', '성공적으로 스터디를 나갔습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('스터디 나가기 실패:', error);
      Alert.alert('오류', '스터디를 나가는 도중 오류가 발생했습니다.');
    }
  };

  const handleDelegateHost = async (newHostId, newHostName) => {
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
              const response = await api.patch(`/studies/${studyId}/delegate-host`, { 
                newHostId,
                currentUserId
              });
              if (response.status === 200) {
                Alert.alert('알림', `${newHostName}님에게 스터디장 권한이 위임되었습니다.`, [{ text: '확인' }]);
                setIsMenuVisible(false);
              }
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

  const handleManageStudy = () => {
    setIsMenuVisible(false);
    navigation.navigate('StudyManagementScreen', {
      studyId: studyId,
      studyName: studyName,
      members: members,
      hostId: studyInfo?.host?._id 
    });
  };

  const handleViewProfile = (userId) => {
    navigation.navigate('내 프로필', { profileUserId: userId }); 
  };

  const fetchData = useCallback(async () => {
    try {
      console.log('[Studyroommain] route.params =', route?.params);
      if (!studyId) {
        Alert.alert('오류', 'studyId가 비어 있습니다. 이전 화면에서 다시 진입해주세요.');
        return;
      }

      const currentUserId = await AsyncStorage.getItem('userId');

      const reqs = [
        { key: 'files',    url: `/studies/${studyId}/files` },
        { key: 'schedule', url: `/schedule/study/${studyId}` },
        { key: 'posts',    url: `/api/posts/study/${studyId}` },
        { key: 'study',    url: `/studies/${studyId}` },
      ];
      console.log('[Studyroommain] GET URLs =', reqs.map(r=>r.url));
      const settled = await Promise.allSettled(reqs.map(r => api.get(r.url)));
      
      const fails = settled
        .map((res, i) => ({ res, req: reqs[i] }))
        .filter(({ res }) => res.status === 'rejected');
      if (fails.length) {
        const msg = fails.map(({ req, res }) => {
          const st = res.reason?.response?.status;
          const detail = res.reason?.response?.data?.message || res.reason?.message || '';
          return `• ${req.url} → ${st || 'ERR'} ${detail}`;
        }).join('\n');
        console.warn('❌ Studyroom fetch fails:\n' + msg);
        Alert.alert('일부 데이터 로드 실패', msg);
      }

      const pick = (k) => {
        const i = reqs.findIndex(r => r.key === k);
        return settled[i];
      };

      const filesRes    = pick('files');
      const scheduleRes = pick('schedule');
      const postsRes    = pick('posts');
      const studyRes    = pick('study');

      if (filesRes.status === 'fulfilled') setFiles(filesRes.value.data);
      if (scheduleRes.status === 'fulfilled') setSchedules(Array.isArray(scheduleRes.value.data) ? scheduleRes.value.data : []);
      if (postsRes.status === 'fulfilled') setPosts(postsRes.value.data);
      if (studyRes.status === 'fulfilled') {
        setStudyInfo(studyRes.value.data);
        setMembers(studyRes.value.data?.members || []);
        const hostId = studyRes.value.data?.host?._id;
        setIsHost(!!currentUserId && !!hostId && hostId === currentUserId);
      }
    } catch (err) {
      console.error('데이터 불러오기 실패:', err);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    }
  }, [studyId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const selectedSchedules = schedules.filter(s => {
    const startDate = s.startDate?.split('T')[0];
    return startDate === selectedDate;
  });

  const markedDates = schedules.reduce((acc, s) => {
    if (s.startDate) {
      const key = s.startDate.split('T')[0];
      acc[key] = { ...(acc[key] || {}), marked: true, dotColor: '#4C63D2' };
    }
    return acc;
  }, {});

  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: '#4C63D2'
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{studyName}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('ScheduleAdd', { studyId })} style={styles.headerIconBtn}>
            <Ionicons name="calendar-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.headerIconBtn}>
            <Ionicons name="menu-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              selectedDayBackgroundColor: '#4C63D2',
              todayTextColor: '#4C63D2',
              arrowColor: '#4C63D2',
              monthTextColor: '#1a1a1a',
              textMonthFontWeight: '700',
              textDayFontSize: 14,
              textMonthFontSize: 16,
            }}
            monthFormat={'yyyy년 M월'}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#4C63D2" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>
              {new Date(selectedDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 일정
            </Text>
          </View>

          {selectedSchedules.length === 0 ? (
            <View style={styles.emptySchedule}>
              <Ionicons name="calendar-outline" size={48} color="#D5D9FF" />
              <Text style={styles.emptyText}>일정이 없습니다</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('ScheduleAdd', { studyId })} 
                style={styles.addScheduleBtn}
              >
                <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.addScheduleText}>일정 등록하기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedSchedules.map((sch) => (
              <View key={sch._id} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleTitle}>{sch.title}</Text>
                  <Ionicons name="time-outline" size={16} color="#4C63D2" />
                </View>
                
                {sch.description && (
                  <Text style={styles.scheduleDesc}>{sch.description}</Text>
                )}
                
                <View style={styles.scheduleInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="time" size={14} color="#666" />
                    <Text style={styles.infoText}>{sch.startTime} ~ {sch.endTime}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={14} color="#666" />
                    <Text style={styles.infoText}>{sch.location || '장소 미정'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={14} color="#666" />
                    <Text style={styles.infoText}>
                      {sch.createdBy?.username || '알 수 없음'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="people" size={14} color="#666" />
                    <Text style={styles.infoText}>
                      {sch.participants?.length || 0} / {sch.capacity > 0 ? sch.capacity : '무제한'}
                    </Text>
                  </View>
                </View>

                <ScheduleJoinLeaveButtons schedule={sch} onUpdated={fetchData} />
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder" size={20} color="#4C63D2" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>자료 공유</Text>
            <TouchableOpacity onPress={() => {
              if (studyInfo && studyInfo.host) {
                navigation.navigate('FileShare', {
                  studyId: studyId,
                  studyHostId: studyInfo.host._id
                });
              } else {
                Alert.alert('오류', '스터디 정보를 불러오고 있습니다. 잠시 후 다시 시도해주세요.');
              }
            }}>
              <Ionicons name="arrow-forward" size={20} color="#4C63D2" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentCard}>
            {files.length === 0 ? (
              <View style={styles.emptyContent}>
                <Ionicons name="document-outline" size={36} color="#D5D9FF" />
                <Text style={styles.emptyContentText}>공유된 자료가 없습니다</Text>
              </View>
            ) : (
              files.slice(0, 3).map((file, idx) => (
                <View key={idx} style={styles.fileItem}>
                  <Ionicons name="document-text" size={18} color="#4C63D2" />
                  <Text style={styles.fileText} numberOfLines={1}>{file.title}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles" size={20} color="#4C63D2" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>게시판</Text>
            <TouchableOpacity onPress={() => {
              if (studyInfo && studyInfo.host) {
                navigation.navigate('Board', {
                  studyId: studyId,
                  studyName: studyName,
                  studyHostId: studyInfo.host._id
                });
              } else {
                Alert.alert('오류', '스터디 정보를 불러오고 있습니다. 잠시 후 다시 시도해주세요.');
              }
            }}>
              <Ionicons name="arrow-forward" size={20} color="#4C63D2" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentCard}>
            {posts.length === 0 ? (
              <View style={styles.emptyContent}>
                <Ionicons name="chatbubble-outline" size={36} color="#D5D9FF" />
                <Text style={styles.emptyContentText}>작성된 게시글이 없습니다</Text>
              </View>
            ) : (
              posts.slice(0, 3).map((post) => (
                <View key={post._id} style={styles.postItem}>
                  <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
                  <Text style={styles.postContent} numberOfLines={2}>{post.content}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
      
      <StudyMenu
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        isHost={isHost}
        members={members}
        onLeaveStudy={handleLeaveStudy}
        hostId={studyInfo?.host?._id}
        onDelegateHost={handleDelegateHost}
        onManageStudy={handleManageStudy}
        onViewProfile={handleViewProfile}
      />
    </SafeAreaView>
  );
};

const ScheduleJoinLeaveButtons = ({ schedule, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  if (!userId) return null;

  const isJoined = schedule.participants?.some(p => p._id === userId || p === userId);
  const isHost = schedule.createdBy?._id === userId || schedule.createdBy === userId;

  const handleJoin = async () => {
    try {
      setLoading(true);
      await api.post('/schedule/join', { scheduleId: schedule._id, userId });
      Alert.alert('알림', '일정에 참여했습니다.');
      onUpdated();
    } catch (err) {
      console.error('일정 참여 실패:', err);
      Alert.alert('오류', err?.response?.data?.message || '참여 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setLoading(true);
      await api.post('/schedule/leave', { scheduleId: schedule._id, userId });
      Alert.alert('알림', '참여를 취소했습니다.');
      onUpdated();
    } catch (err) {
      console.error('일정 취소 실패:', err);
      Alert.alert('오류', err?.response?.data?.message || '취소 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      '일정 삭제',
      '정말 이 일정을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/schedule/${schedule._id}/${userId}`);
              Alert.alert('알림', '일정이 삭제되었습니다.');
              onUpdated();
            } catch (err) {
              Alert.alert('오류', err?.response?.data?.message || '삭제 실패');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.buttonRow}>
      {isHost ? (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={loading}>
          <Ionicons name="trash-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.deleteBtnText}>{loading ? '삭제 중...' : '일정 삭제'}</Text>
        </TouchableOpacity>
      ) : (
        <>
          {isJoined ? (
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} disabled={loading}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.leaveBtnText}>{loading ? '취소 중...' : '취소하기'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} disabled={loading}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.joinBtnText}>{loading ? '신청 중...' : '참여하기'}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export default Studyroommain;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4C63D2',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
  },
  scrollContainer: {
    flex: 1,
  },
  calendarCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  section: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptySchedule: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
  },
  addScheduleBtn: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  addScheduleText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8EAFF',
    borderLeftWidth: 4,
    borderLeftColor: '#4C63D2',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  scheduleDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18,
  },
  scheduleInfo: {
    gap: 6,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  joinBtn: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  leaveBtn: {
    flexDirection: 'row',
    backgroundColor: '#999',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  leaveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF5B5B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyContentText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FF',
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  fileText: {
    flex: 1,
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  postItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  postContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
