import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function SettingScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState({
    push: true,
    chat: true,
    apply: true,
    approve: true,
    schedule: true,
    reminder: true,
    commentApply: true,
    commentPost: true,
    notice: true
  });
  const [savedNotifications, setSavedNotifications] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const response = await api.get(`/profile/${userId}`);
        const data = response.data.notifications ?? notifications;
        setNotifications(data);
        setSavedNotifications(data);
      } catch (error) {
        console.error('알림 설정 불러오기 실패:', error.message);
      }
    };
    fetchSettings();
  }, []);

  const toggleSwitch = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await api.patch(`/profile/${userId}/notifications`, { notifications });
      setSavedNotifications({ ...notifications });
      Alert.alert('성공', '알림 설정이 저장되었습니다.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('실패', '알림 설정 저장 중 오류 발생');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert('계정 탈퇴', '정말로 계정을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴', style: 'destructive', onPress: async () => {
          try {
            const userId = await AsyncStorage.getItem('userId');
            await api.delete(`/profile/${userId}`);
            await AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (error) {
            Alert.alert('실패', '계정 삭제 중 오류 발생');
          }
        }
      }
    ]);
  };

  const renderSwitch = (key, label) => (
    <View style={styles.row} key={key}>
      <Text style={[styles.label, !notifications.push && styles.labelDisabled]}>{label}</Text>
      <Switch
        value={notifications[key]}
        onValueChange={() => toggleSwitch(key)}
        disabled={!notifications.push}
        trackColor={{ false: '#d1d5db', true: '#7986CB' }}
        thumbColor={notifications[key] ? '#3949AB' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>설정</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 알림 설정 카드 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications-outline" size={24} color="#3949AB" />
              <Text style={styles.title}>알림 설정</Text>
            </View>

            <View style={styles.mainRow}>
              <Text style={styles.mainLabel}>앱 전체 알림</Text>
              <Switch
                value={notifications.push}
                onValueChange={(value) => {
                  if (!value) {
                    const allOff = {};
                    Object.keys(notifications).forEach(key => {
                      allOff[key] = false;
                    });
                    setNotifications(allOff);
                  } else {
                    setNotifications(prev => ({
                      ...savedNotifications,
                      push: true
                    }));
                  }
                }}
                trackColor={{ false: '#d1d5db', true: '#7986CB' }}
                thumbColor={notifications.push ? '#3949AB' : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            {renderSwitch('chat', '채팅 알림')}
            {renderSwitch('apply', '스터디 가입 신청 알림')}
            {renderSwitch('approve', '승인/거절 알림')}
            {renderSwitch('schedule', '일정 등록 알림')}
            {renderSwitch('reminder', '일정 D-1 리마인드 알림')}
            {renderSwitch('commentApply', '가입신청 댓글 알림')}
            {renderSwitch('commentPost', '게시글 댓글 알림')}
            {renderSwitch('notice', '공지사항 알림')}
          </View>

          {/* 계정 탈퇴 */}
          <TouchableOpacity style={styles.deleteBox} onPress={handleDeleteAccount}>
            <View style={styles.deleteContent}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.deleteText}>계정 탈퇴</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* 저장 버튼 */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

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
    backgroundColor: '#3949AB', // 인디고
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mainLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  label: { 
    fontSize: 15,
    color: '#333',
  },
  labelDisabled: {
    color: '#999',
  },
  deleteBox: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deleteContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteText: { 
    color: '#ef4444', 
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#3949AB', // 인디고
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3949AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 16,
    fontWeight: '700',
  }
});