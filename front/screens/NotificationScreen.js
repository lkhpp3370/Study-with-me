import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import api from '../services/api';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // ✅ 알림 데이터 불러오기 함수 정의 (재사용 위해 밖에 뺌)
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      const response = await api.get(`/notification/${userId}`);
      const filtered = response.data.filter(n => n.type !== 'chat');
      setNotifications(filtered);
    } catch (err) {
      console.error('알림 불러오기 실패:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ 최초 렌더링 시
  useEffect(() => {
    fetchNotifications();
  }, []);

  // ✅ 화면에 포커스될 때마다 새로고침
  useEffect(() => {
    if (isFocused) fetchNotifications();
  }, [isFocused]);

  const groupByDate = () => {
    const grouped = {};
    notifications.forEach(noti => {
      const date = new Date(noti.createdAt).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(noti);
    });
    return Object.keys(grouped).map(date => ({
      title: date,
      data: grouped[date].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }));
  };

  const handlePress = async (noti) => {
    try {
      if (!noti.isRead) {
        await api.patch(`/notification/read/${noti._id}`);
      }

      switch (noti.type) {
        case 'schedule':
        case 'reminder':
          if (noti.targetType === 'Schedule' && noti.targetId) {
            try {
              const res = await api.get(`/schedule/${noti.targetId}`);
              const studyId = res.data.study?._id || res.data.study;
              if (studyId) {
                navigation.navigate('스터디상세', { studyId });
              } else {
                Alert.alert('오류', '연결된 스터디 정보를 찾을 수 없습니다.');
              }
            } catch (err) {
              console.error('🔴 스케줄 정보 조회 실패:', err.message);
              Alert.alert('오류', '일정 정보를 가져오는 데 실패했습니다.');
            }
          } else {
            navigation.navigate('Tabs', { screen: '홈' });
          }
          break;

        case 'apply':
        case 'approve':
        case 'commentApply':
        case 'commentPost':
        case 'notice':
          navigation.navigate('스터디상세');
          break;

        default:
          console.warn('알 수 없는 알림 유형입니다:', noti.type);
          break;
      }
    } catch (err) {
      console.error('🔴 알림 이동 오류:', err.message);
      Alert.alert('오류', '알림 처리 중 오류가 발생했습니다.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await api.patch(`/notification/user/${userId}/readAll`);
      const updated = notifications.map(n => ({ ...n, isRead: true, readAt: new Date() }));
      setNotifications(updated);
    } catch (err) {
      Alert.alert('실패', '전체 읽음 처리에 실패했습니다.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemBox, !item.isRead && styles.unread]}
      onPress={() => handlePress(item)}
    >
      <Text style={styles.content}>{item.content}</Text>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={styles.markAll}>전체 읽음</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : notifications.length === 0 ? (
        <Text style={styles.emptyText}>알림이 없습니다</Text>
      ) : (
        <SectionList
          sections={groupByDate()}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
        />
      )}
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 35
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.8,
    borderColor: '#ddd',
    backgroundColor: '#001f3f'
  },
  headerTitle: { fontSize: 18, color: 'white'},
  markAll: { color: '#007bff', fontSize: 14 },
  itemBox: { padding: 12, borderBottomWidth: 0.5, borderColor: '#ccc' },
  unread: { backgroundColor: '#eef6ff' },
  content: { fontSize: 15 },
  date: { fontSize: 12, color: '#888', marginTop: 4 },
  sectionHeader: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 6,
    paddingHorizontal: 16,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#444'
  },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#888' }
});
