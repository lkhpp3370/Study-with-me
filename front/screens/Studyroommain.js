import React, { useState, useRef, useEffect } from 'react';
import { Dimensions, View, Text, StyleSheet, TouchableOpacity, ScrollView, PanResponder, Animated, Image, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filesRes = await api.get('/material/files');
        setFiles(filesRes.data);

        if (studyId) {
          const scheduleRes = await api.get(`/schedule/study/${studyId}`);
          setSchedules(scheduleRes.data);
        }
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
          <Text style={styles.title}>study_name</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('ScheduleAdd')}>
              <Image source={require('../assets/calendaradd.png')} style={{ width: 30, height: 30 }} />
            </TouchableOpacity>
            <TouchableOpacity>
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
          <TouchableOpacity onPress={() => navigation.navigate('FileShare')}>
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
          <TouchableOpacity onPress={() => navigation.navigate('Board')}>
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
