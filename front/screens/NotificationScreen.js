import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

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

  useEffect(() => {
    fetchNotifications();
  }, []);

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
      Alert.alert('완료', '모든 알림을 읽음 처리했습니다.');
    } catch (err) {
      Alert.alert('실패', '전체 읽음 처리에 실패했습니다.');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'schedule':
      case 'reminder':
        return 'calendar-outline';
      case 'apply':
        return 'person-add-outline';
      case 'approve':
        return 'checkmark-circle-outline';
      case 'commentApply':
      case 'commentPost':
        return 'chatbox-outline';
      case 'notice':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemBox, !item.isRead && styles.unread]}
      onPress={() => handlePress(item)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getNotificationIcon(item.type)} 
          size={24} 
          color={item.isRead ? '#999' : '#3949AB'} 
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.content, !item.isRead && styles.contentUnread]}>
          {item.content}
        </Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>알림</Text>
          <TouchableOpacity 
            onPress={handleMarkAllAsRead}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>전체 읽음</Text>
          </TouchableOpacity>
        </View>

        {/* 콘텐츠 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3949AB" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>알림이 없습니다</Text>
          </View>
        ) : (
          <SectionList
            sections={groupByDate()}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeader}>{section.title}</Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3949AB', // 인디고
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#3949AB', // 인디고
  },
  headerTitle: { 
    fontSize: 20, 
    color: '#fff',
    fontWeight: '700',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  markAllText: { 
    color: '#fff', 
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 16, 
    color: '#999',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeaderContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontWeight: '600',
    fontSize: 13,
    color: '#7986CB', // 연한 인디고
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemBox: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  unread: { 
    backgroundColor: '#E8EAF6', // 아주 연한 인디고
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  content: { 
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
  contentUnread: {
    color: '#1a1a1a',
    fontWeight: '500',
  },
  date: { 
    fontSize: 12, 
    color: '#999', 
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3949AB', // 인디고
    marginLeft: 8,
  },
});