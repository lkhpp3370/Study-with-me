// screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native'; // ✅ 추가
import { Ionicons } from '@expo/vector-icons';
import { Menu, Divider, Provider } from 'react-native-paper';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();   // ✅ 추가
  const [visible, setVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const fetchProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const response = await api.get(`/profile/${userId}`);
      setProfileData(response.data);
    } catch (error) {
      console.error('❌ 프로필 데이터 불러오기 실패:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 화면이 Focus 될 때마다 최신화
  useEffect(() => {
    setLoading(true);      // 다시 로딩 시작
    fetchProfile();
  }, [isFocused]);

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }]
          });
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A2D3D" />
      </View>
    );
  }

  return (
    <Provider>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={
              <TouchableOpacity style={styles.menuIcon} onPress={openMenu}>
                <Ionicons name="ellipsis-vertical" size={24} color="white" />
              </TouchableOpacity>
            }
          >
            <Menu.Item onPress={() => { closeMenu(); navigation.navigate('프로필 관리'); }} title="프로필 관리" />
            <Divider />
            <Menu.Item onPress={() => { closeMenu(); navigation.navigate('설정'); }} title="설정" />
            <Divider />
            <Menu.Item onPress={() => { closeMenu(); handleLogout(); }} title="로그아웃" />
          </Menu>
        </View>

        <View style={styles.card}>
          <View style={styles.profileHeader}>
            {profileData.profile_image ? (
              <Image source={{ uri: profileData.profile_image }} style={styles.profileImage} />
            ) : (
              <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.profileImage} />
            )}
            <View>
              <Text style={styles.userName}>{profileData.username}</Text>
              <Text style={styles.userInfo}>
                {profileData.major ?? '학과 없음'} {profileData.grade ? `${profileData.grade}학년` : ''}
              </Text>
              <Text style={styles.userEmail}>{profileData.email}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>소개글</Text>
          <Text style={styles.introText}>{profileData.bio ?? '소개글이 없습니다.'}</Text>

          <Text style={styles.sectionTitle}>지난달 스터디 출석률</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={{ color: '#888' }}>그래프 자리 (구현 예정)</Text>
          </View>
        </View>
      </View>
    </Provider>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', padding: 10, marginTop: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#001f3f', paddingHorizontal: 10, height: 40 },
  backButton: { marginLeft: 5 },
  menuIcon: { marginRight: -5 },
  card: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20, marginTop: 10 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginRight: 15 },
  userName: { fontSize: 18, fontWeight: 'bold' },
  userInfo: { fontSize: 14, color: '#777', marginTop: 5 },
  userEmail: { fontSize: 13, color: '#555', marginTop: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 30 },
  introText: { fontSize: 14, color: '#555', marginVertical: 10 },
  chartPlaceholder: { width: '100%', height: 300, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginTop: 30, borderRadius: 10 }
});
