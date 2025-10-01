// screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native'; // ✅ 추가
import { Ionicons } from '@expo/vector-icons';
import { Menu, Divider, Provider } from 'react-native-paper';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ route }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();   // ✅ 추가
  const [visible, setVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myPendingApps, setMyPendingApps] = useState([]); // 내가 신청한 스터디 목록
  const [hostPendingApps, setHostPendingApps] = useState([]); // 내가 호스트인 스터디의 대기 목록

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const fetchProfile = async () => {
    try {
      // ✅ route.params에서 profileUserId를 가져옵니다.
      const targetUserId = route.params?.profileUserId; 

      // ✅ 조회할 ID를 결정합니다. (targetUserId가 있으면 그 ID를, 없으면 AsyncStorage의 userId를 사용)
      let userId;
      if (targetUserId) {
          userId = targetUserId;
      } else {
          userId = await AsyncStorage.getItem('userId');
      }
      
      if (!userId) return;

      const response = await api.get(`/profile/${userId}`);
      setProfileData(response.data);

      if (!targetUserId) {
          // 2-1. 내가 신청한 스터디 목록 (상태가 'pending'인 신청)
          const myPendingRes = await api.get(`/applications/my-pending?userId=${userId}`); 
          setMyPendingApps(myPendingRes.data);

          // 2-2. 내가 스터디장인 스터디의 가입 대기 목록
          const hostPendingRes = await api.get(`/applications/host-pending?hostId=${userId}`);
          setHostPendingApps(hostPendingRes.data);
      } else {
          setMyPendingApps([]);
          setHostPendingApps([]);
      }
    } catch (error) {
      console.error('❌ 프로필 데이터 불러오기 실패:', error.message);
      setMyPendingApps([]);
      setHostPendingApps([]);
    } finally {
      setLoading(false);
    }
  };


  // ✅ 화면이 Focus 될 때마다 최신화
  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [isFocused, route.params?.profileUserId]);

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

  // 내가 신청한 스터디 목록 렌더링
  const renderMyPendingList = () => {
    // 현재 사용자가 본인 프로필을 보고 있는지 확인
    const isMyProfile = !route.params?.profileUserId;
    if (!isMyProfile) return null;

    return (
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>내가 신청한 스터디 (승인 대기)</Text>
        {myPendingApps.length === 0 ? (
          <Text style={styles.emptyText}>현재 대기 중인 신청이 없습니다.</Text>
        ) : (
          myPendingApps.map((item) => (
            <TouchableOpacity 
              key={item.study._id} 
              style={styles.listItem}
              // ✅ 스터디소개 화면으로 이동
              onPress={() => navigation.navigate('스터디소개', { 
                study: item.study, 
                userId: profileData._id 
              })}
            >
              <Text style={styles.listItemText}>{item.study.title}</Text>
              <Text style={styles.pendingBadge}>대기 중</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  // 내가 호스트인 스터디의 대기 목록 렌더링
  const renderHostPendingList = () => {
    const isMyProfile = !route.params?.profileUserId;
    if (!isMyProfile) return null;
    
    return (
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>내 스터디 가입 대기 목록</Text>
        {hostPendingApps.length === 0 ? (
          <Text style={styles.emptyText}>새로운 가입 대기 신청이 없습니다.</Text>
        ) : (
          hostPendingApps
            .filter(item => item.count > 0) // 대기 건수가 0인 스터디는 숨김 (선택 사항)
            .map((item) => (
            <TouchableOpacity 
              key={item._id} 
              style={styles.listItem}
              // ✅ StudyManagementScreen으로 네비게이션
              onPress={() => {
                navigation.navigate('StudyManagementScreen', { 
                  studyId: item._id,       // 스터디 ID
                  studyName: item.title,   // 스터디 이름
                  members: item.members, 
                  hostId: item.host       // 스터디 호스트 ID
                });
              }}
            >
              <Text style={styles.listItemText}>
                {item.title} ({item.count}건)
              </Text>
              <Text style={styles.actionBadge}>관리</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
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

          {profileData && !route.params?.profileUserId && (
            <>
              {renderMyPendingList()}
              {renderHostPendingList()}
            </>
          )}

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
  listSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  emptyText: {
    fontSize: 13,
    color: '#888',
    paddingVertical: 10,
  },
  pendingBadge: {
    backgroundColor: '#ffc107',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBadge: {
    backgroundColor: '#007bff',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
