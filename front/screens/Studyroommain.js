import React, { useState, useRef, useEffect } from 'react';
import { Dimensions, View, Text, StyleSheet, TouchableOpacity, ScrollView, PanResponder, Animated, Image, Alert, Modal } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import StudyMenu from './StudyMenu'; // StudyMenu 컴포넌트 import
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// 달력 한국어 설정
LocaleConfig.locales['ko'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
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
  const [studyInfo, setStudyInfo] = useState(null); // 스터디 정보 상태 추가
  const [isMenuVisible, setIsMenuVisible] = useState(false); // 메뉴 가시성 상태 추가
  const [isHost, setIsHost] = useState(false); // 사용자 역할 상태 추가
  const [members, setMembers] = useState([]); // 멤버 목록 상태 추가

  // ✅ 스터디 나가기 로직 추가
  const handleLeaveStudy = async () => {
    if (isHost) { // isHost는 state 또는 prop으로 관리되어야 합니다.
        Alert.alert(
            "경고",
            "방장은 스터디를 나가기 전에 다른 스터디원에게 방장 권한을 위임해야 합니다.",
            [{ text: "확인" }]
        );
        return;
    }
    try {
      const currentUserId = await AsyncStorage.getItem('userId');
      if (!currentUserId) {
        Alert.alert('오류', '로그인 상태를 확인해주세요.');
        return;
      }
      
      // 백엔드 API 호출
      await api.delete(`/studies/${studyId}/members/${currentUserId}`);

      Alert.alert('알림', '성공적으로 스터디를 나갔습니다.', [
        { text: '확인', onPress: () => navigation.goBack() } // 🚨 스터디룸 화면에서 벗어나기
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
            {
                text: "취소",
                style: "cancel"
            },
            {
                text: "위임",
                onPress: async () => {
                    try {
                        const currentUserId = await AsyncStorage.getItem('userId');
                        const response = await api.patch(`/studies/${studyId}/delegate-host`, { 
                            newHostId,
                            currentUserId // 🚨 현재 사용자 ID를 body에 추가
                        });
                        if (response.status === 200) {
                            Alert.alert('알림', `${newHostName}님에게 스터디장 권한이 위임되었습니다.`, [
                                { text: '확인', onPress: () => navigation.goBack() }
                            ]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filesRes = await api.get(`/studies/${studyId}/files`);
        setFiles(filesRes.data);

        if (studyId) {
          const scheduleRes = await api.get(`/schedule/study/${studyId}`);
          setSchedules(scheduleRes.data);
        }

        const postsRes = await api.get(`/api/posts/study/${studyId}`);
        setPosts(postsRes.data);
        
        // 스터디 정보 가져오기 (방장 여부 확인 및 멤버 데이터 전달을 위해)
        const studyRes = await api.get(`/studies/${studyId}`);
        setStudyInfo(studyRes.data);
        
        // 여기에 현재 로그인된 사용자의 ID를 설정해야 합니다.
        const currentUserId = await AsyncStorage.getItem('userId'); 
        if (currentUserId && studyRes.data.host && studyRes.data.host._id === currentUserId) {
          setIsHost(true);
        }

        setMembers(studyRes.data.members);

      } catch (err) {
        console.error('데이터 불러오기 실패:', err);
        Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
      }
    };
    fetchData();
  }, [studyId]);

  const selectedSchedules = schedules.filter(s => s.date === selectedDate);

  // 채팅 버튼 위치
  const initialX = Dimensions.get('window').width - 76;
  const initialY = Dimensions.get('window').height - 160;
  const [pan] = useState(new Animated.ValueXY({ x: initialX, y: initialY }));
  const lastOffset = useRef({ x: initialX, y: initialY }).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (e, gestureState) => {
      pan.setValue({
        x: lastOffset.x + gestureState.dx,
        y: lastOffset.y + gestureState.dy
      });
    },
    onPanResponderRelease: (e, gestureState) => {
      lastOffset.x += gestureState.dx;
      lastOffset.y += gestureState.dy;
    }
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f6f7' }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>{studyName}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('ScheduleAdd')}>
              <Image source={require('../assets/calendaradd.png')} style={{ width: 30, height: 30 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
              <Ionicons name="menu-outline" size={24} color="white" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 달력 */}
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: '#00adf5' } }}
          style={styles.calendar}
          theme={{ selectedDayBackgroundColor: '#00adf5', todayTextColor: '#00adf5' }}
          monthFormat={'yyyy년 M월'}
        />

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
          <TouchableOpacity onPress={() => navigation.navigate('Board', { studyId, studyName })}>
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

        {/* 일정 */}
        <View style={styles.scheduleBox}>
          {selectedSchedules.length === 0 ? (
            <>
              <Ionicons name="calendar-outline" size={30} color="#777" />
              <Text style={styles.scheduleText}>일정이 없습니다</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ScheduleAdd')} style={styles.addScheduleButton}>
                <Text style={styles.addScheduleText}>+ 일정 등록하기</Text>
              </TouchableOpacity>
            </>
          ) : (
            selectedSchedules.map((sch) => (
              <View key={sch._id} style={styles.scheduleCard}>
                <Text style={styles.scheduleTitle}>{sch.title}</Text>
                <Text>{`${sch.startTime}~${sch.endTime} (${sch.location})`}</Text>
              </View>
            ))
          )}
        </View>

        {/* 드래그 가능한 채팅 버튼 */}
        <Animated.View style={[styles.chatButton, pan.getLayout()]} {...panResponder.panHandlers}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="white" />
        </Animated.View>
      </View>
      
      {/* 메뉴 컴포넌트 추가 */}
      <StudyMenu
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        isHost={isHost}
        members={members}
        onLeaveStudy={handleLeaveStudy}
        hostId={studyInfo?.host?._id}
        onDelegateHost={handleDelegateHost}
      />
    </ScrollView>
  );
};

export default Studyroommain;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f7', paddingTop: 35 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#001f3f', paddingHorizontal: 16, paddingVertical: 10 },
  title: { color: 'white', fontSize: 18 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  calendar: { margin: 10, borderRadius: 10 },
  bigBox: { height: 180, backgroundColor: 'white', borderRadius: 10, marginHorizontal: 10, marginBottom: 10, padding: 10 },
  fileList: { flex: 1 },
  fileItem: { backgroundColor: '#f7f7f7', padding: 10, marginBottom: 5, borderRadius: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  moreText: { color: '#00adf5', fontWeight: 'bold' },
  scheduleBox: { backgroundColor: 'white', margin: 10, borderRadius: 10, padding: 10, alignItems: 'center' },
  scheduleCard: { marginBottom: 10, padding: 5, backgroundColor: '#e0f7ff', borderRadius: 5, width: '100%' },
  scheduleTitle: { fontWeight: 'bold', fontSize: 14 },
  scheduleText: { color: '#555', fontSize: 13 },
  addScheduleButton: { marginTop: 10, backgroundColor: '#00adf5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 5 },
  addScheduleText: { color: 'white', fontWeight: 'bold' },
  chatButton: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: '#00adf5', justifyContent: 'center', alignItems: 'center', elevation: 5 }
});