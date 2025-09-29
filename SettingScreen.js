import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
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
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={notifications[key]}
        onValueChange={() => toggleSwitch(key)}
        disabled={!notifications.push}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>알림 설정</Text>

        <View style={styles.row}>
          <Text style={styles.label}>앱 전체 알림</Text>
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
          />
        </View>

        {renderSwitch('chat', '채팅 알림')}
        {renderSwitch('apply', '스터디 가입 신청 알림')}
        {renderSwitch('approve', '승인/거절 알림')}
        {renderSwitch('schedule', '일정 등록 알림')}
        {renderSwitch('reminder', '일정 D-1 리마인드 알림')}
        {renderSwitch('commentApply', '가입신청 댓글 알림')}
        {renderSwitch('commentPost', '게시글 댓글 알림')}
        {renderSwitch('notice', '공지사항 알림')}
      </View>

      <TouchableOpacity style={styles.deleteBox} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>계정 탈퇴 {'>'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>저장</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  card: { backgroundColor: '#F7F7F7', padding: 20, borderRadius: 10, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc'
  },
  label: { fontSize: 15 },
  deleteBox: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'flex-start'
  },
  deleteText: { color: '#333', fontSize: 15 },
  saveButton: {
    backgroundColor: '#001f3f',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  saveButtonText: { color: '#fff', fontSize: 16 }
});
