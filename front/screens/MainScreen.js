// screens/MainScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, BackHandler } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

LocaleConfig.locales['ko'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'ko';

export default function MainScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [studyGroups, setStudyGroups] = useState([]);
  const [userName, setUserName] = useState('');
  const [schedules, setSchedules] = useState({});
  const [groupedSchedules, setGroupedSchedules] = useState({});
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert("앱 종료", "앱을 종료하시겠습니까?", [
          { text: "취소", onPress: () => null, style: "cancel" },
          { text: "종료", onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      });
      return () => backHandler.remove();
    }, [])
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        const userId = await AsyncStorage.getItem('userId');
        if (name) setUserName(name);

        if (userId) {
          const response = await api.get(`/main/${userId}`);
          setStudyGroups(response.data.studies);

          const scheduleRes = await api.get(`/schedule/user/${userId}`);
          const marked = {};
          const grouped = {};

          scheduleRes.data.forEach(sch => {
            const date = sch.start.split('T')[0];
            if (!marked[date]) marked[date] = { marked: true, dots: [{ color: 'blue' }] };
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(sch);
          });

          setSchedules(marked);
          setGroupedSchedules(grouped);
          setSelectedSchedules(grouped[today] || []);
        }
      } catch (error) {
        console.error('데이터 불러오기 실패:', error.message);
      }
    };
    loadData();
  }, []);

  const handleDayPress = (day) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    setSelectedSchedules(groupedSchedules[dateStr] || []);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={20} color="white" onPress={() => navigation.navigate('알림내역')} />
        <TouchableOpacity onPress={() => navigation.navigate('내 프로필')}>
          <Text style={styles.username}>{userName || 'user_name'}</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          ...schedules,
          [selectedDate]: { ...(schedules[selectedDate] || {}), selected: true, selectedColor: '#00adf5' }
        }}
        style={styles.calendar}
        theme={{ selectedDayBackgroundColor: '#00adf5', todayTextColor: '#00adf5' }}
        monthFormat={'yyyy년 M월'}
      />

      <View style={styles.scheduleBox}>
        {selectedSchedules.length === 0 ? (
          <>
            <Ionicons name="calendar-outline" size={30} color="#777" />
            <Text style={styles.scheduleText}>일정이 없습니다</Text>
          </>
        ) : (
          selectedSchedules.map((sch, index) => {
            const startTime = new Date(sch.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(sch.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <View key={index} style={styles.scheduleCard}>
                <Text style={styles.scheduleTitle}>{sch.study?.title || '스터디명 없음'}</Text>
                <Text style={styles.scheduleText}>
                  {`${startTime} ~ ${endTime} - ${sch.title} (${sch.location || '장소 미정'})`}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <Text style={styles.sectionTitle}>내 스터디 그룹 목록</Text>
      <ScrollView style={styles.studyList}>
        {studyGroups.length === 0 ? (
          <Text style={styles.emptyText}>가입중인 스터디가 없습니다</Text>
        ) : (
          studyGroups.map((study) => (
            <TouchableOpacity key={study._id} style={styles.studyItem}
              onPress={() => navigation.navigate('스터디상세', { study })}
            >
              <Text style={styles.studyTitle}>{study.title}</Text>
              <Text style={styles.studyDesc}>{study.description}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('채팅')}>
        <Ionicons name="chatbubbles-outline" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f7', paddingTop: 35 },
  header: { height: 50, backgroundColor: '#001f3f', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  username: { color: 'white', fontSize: 16 },
  calendar: { marginTop: 10, borderRadius: 10, marginHorizontal: 16 },
  scheduleBox: { minHeight: 80, backgroundColor: 'white', margin: 16,
    borderRadius: 10, padding: 10, justifyContent: 'center', alignItems: 'center' },
  scheduleCard: { paddingVertical: 6, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#ddd', width: '100%' },
  scheduleTitle: { fontWeight: 'bold', fontSize: 13, color: '#333' },
  scheduleText: { marginTop: 2, color: '#555', fontSize: 13 },
  sectionTitle: { marginLeft: 16, marginTop: 10, fontWeight: 'bold', fontSize: 16 },
  studyList: { flex: 1, paddingHorizontal: 16 },
  studyItem: { backgroundColor: 'white', padding: 10, borderRadius: 8, marginBottom: 8 },
  studyTitle: { fontSize: 16, fontWeight: 'bold' },
  studyDesc: { fontSize: 13, color: '#555' },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 20 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#00aaff',
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    elevation: 5, zIndex: 10 }
});
