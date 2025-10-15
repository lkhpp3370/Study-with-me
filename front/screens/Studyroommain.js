// screens/Studyroommain.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import StudyMenu from './StudyMenu';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useFocusEffect } from '@react-navigation/native';

// 달력 한국어 설정
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

  /** ✅ 스터디 나가기 */
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

  /** ✅ 스터디장 위임 */
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

  /** ✅ 스터디 관리 이동 */
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

  /** ✅ 데이터 로드 (일정은 /schedule/study/:studyId) */
  const fetchData = useCallback(async () => {
    try {
      const currentUserId = await AsyncStorage.getItem('userId');
      const [filesRes, scheduleRes, postsRes, studyRes] = await Promise.all([
        api.get(`/studies/${studyId}/files`),
        api.get(`/schedule/study/${studyId}`), // 스터디 일정
        api.get(`/api/posts/study/${studyId}`),
        api.get(`/studies/${studyId}`),
      ]);

      setFiles(filesRes.data);
      setSchedules(Array.isArray(scheduleRes.data) ? scheduleRes.data : []);
      setPosts(postsRes.data);
      setStudyInfo(studyRes.data);
      setMembers(studyRes.data.members);

      if (currentUserId && studyRes.data.host && studyRes.data.host._id === currentUserId) {
        setIsHost(true);
      } else {
        setIsHost(false);
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

  /** ✅ 선택 날짜 스케줄 필터링 */
  const selectedSchedules = schedules.filter(s => {
    const startDate = s.startDate?.split('T')[0];
    return startDate === selectedDate;
  });

  /** ✅ 달력 마킹 */
  const markedDates = schedules.reduce((acc, s) => {
    if (s.startDate) {
      const key = s.startDate.split('T')[0];
      acc[key] = { ...(acc[key] || {}), marked: true, dotColor: '#00adf5' };
    }
    return acc;
  }, {});

  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: '#00adf5'
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f6f7' }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>{studyName}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('ScheduleAdd', { studyId })}>
              <Image source={require('../assets/calendaradd.png')} style={{ width: 30, height: 30 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
              <Ionicons name="menu-outline" size={24} color="white" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ 달력 */}
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          style={styles.calendar}
          theme={{ selectedDayBackgroundColor: '#00adf5', todayTextColor: '#00adf5' }}
          monthFormat={'yyyy년 M월'}
        />

        {/* ✅ 일정 */}
        <View style={styles.scheduleBox}>
          {selectedSchedules.length === 0 ? (
            <>
              <Ionicons name="calendar-outline" size={30} color="#777" />
              <Text style={styles.scheduleText}>일정이 없습니다</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ScheduleAdd', { studyId })} style={styles.addScheduleButton}>
                <Text style={styles.addScheduleText}>+ 일정 등록하기</Text>
              </TouchableOpacity>
            </>
          ) : (
            selectedSchedules.map((sch) => (
              <View key={sch._id} style={styles.scheduleCard}>
                <Text style={styles.scheduleTitle}>{sch.title}</Text>
                {sch.description && <Text style={styles.scheduleDesc}>{sch.description}</Text>}
                <Text style={styles.scheduleInfo}>🕒 {sch.startTime} ~ {sch.endTime}</Text>
                <Text style={styles.scheduleInfo}>📍 {sch.location || '장소 미정'}</Text>
                <Text style={styles.scheduleInfo}>
                  👤 개최자: {sch.createdBy?.username || '알 수 없음'}
                </Text>
                <Text style={styles.scheduleInfo}>
                  👥 현재 인원: {sch.participants?.length || 0} / {sch.capacity > 0 ? sch.capacity : '무제한'}
                </Text>

                {/* ✅ 신청/취소 버튼 */}
                <ScheduleJoinLeaveButtons
                  schedule={sch}
                  onUpdated={fetchData}
                />
              </View>
            ))
          )}
        </View>

        {/* 자료 공유 */}
        <View style={styles.sectionHeader}>
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
            <Text style={styles.moreText}>+ MORE</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bigBox}>
          <ScrollView style={styles.fileList} nestedScrollEnabled={true}>
            {files.map((file, idx) => (
              <View key={idx} style={styles.fileItem}>
                <Text>{file.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 게시판 */}
        <View style={styles.sectionHeader}>
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
            <Text style={styles.moreText}>+ MORE</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bigBox}>
          <ScrollView style={styles.fileList} nestedScrollEnabled={true}>
            {posts.map((post) => (
              <View key={post._id} style={styles.fileItem}>
                <Text style={{ fontWeight: 'bold' }}>{post.title}</Text>
                <Text>{post.content}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
      
      {/* 메뉴 */}
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
    </ScrollView>
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
  };

  return (
    <View style={{ flexDirection: 'row', marginTop: 6 }}>
      {isHost ? (
        <>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={loading}>
            <Text style={styles.deleteBtnText}>{loading ? '삭제 중...' : '일정 삭제'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {isJoined ? (
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} disabled={loading}>
              <Text style={styles.leaveBtnText}>{loading ? '취소 중...' : '취소하기'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} disabled={loading}>
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
  container: { flex: 1, backgroundColor: '#f5f6f7', paddingTop: 35 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#001f3f', paddingHorizontal: 16, paddingVertical: 10 },
  title: { color: 'white', fontSize: 18 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  calendar: { margin: 10, borderRadius: 10 },
  scheduleBox: { backgroundColor: 'white', margin: 10, borderRadius: 10, padding: 10, alignItems: 'center' },
  scheduleCard: { marginBottom: 10, padding: 5, backgroundColor: '#e0f7ff', borderRadius: 5, width: '100%' },
  scheduleTitle: { fontWeight: 'bold', fontSize: 14 },
  scheduleText: { color: '#555', fontSize: 13 },
  scheduleCapacity: { color: '#333', fontSize: 12, marginTop: 2 },
  addScheduleButton: { marginTop: 10, backgroundColor: '#00adf5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 5 },
  addScheduleText: { color: 'white', fontWeight: 'bold' },
  bigBox: { height: 180, backgroundColor: 'white', borderRadius: 10, marginHorizontal: 10, marginBottom: 10, padding: 10 },
  fileList: { flex: 1 },
  fileItem: { backgroundColor: '#f7f7f7', padding: 10, marginBottom: 5, borderRadius: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  moreText: { color: '#00adf5', fontWeight: 'bold' },
  joinBtn: {
    backgroundColor: '#00adf5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 4
  },
  joinBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  leaveBtn: {
    backgroundColor: '#aaa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 4
  },
  leaveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  deleteBtn: {
    backgroundColor: '#ff5555',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 6,
  },
  deleteBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  scheduleDesc: { fontSize: 12, color: '#555', marginTop: 2 },
  scheduleInfo: { fontSize: 12, color: '#333', marginTop: 2 },
});
