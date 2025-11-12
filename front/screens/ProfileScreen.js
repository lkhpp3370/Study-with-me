// screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, Divider, Provider } from 'react-native-paper';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ route }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [visible, setVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myPendingApps, setMyPendingApps] = useState([]);
  const [hostPendingApps, setHostPendingApps] = useState([]);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const fetchProfile = async () => {
    try {
      const targetUserId = route.params?.profileUserId; 

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
          const myPendingRes = await api.get(`/applications/my-pending?userId=${userId}`); 
          setMyPendingApps(myPendingRes.data);

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

  const renderMyPendingList = () => {
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
              onPress={() => navigation.navigate('스터디소개', { 
                study: item.study, 
                userId: profileData._id 
              })}
            >
              <Text style={styles.listItemText}>{item.study.title}</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.badgeText}>대기 중</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

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
            .filter(item => item.count > 0)
            .map((item) => (
            <TouchableOpacity 
              key={item._id} 
              style={styles.listItem}
              onPress={() => {
                navigation.navigate('StudyManagementScreen', { 
                  studyId: item._id,
                  studyName: item.title,
                  members: item.members, 
                  hostId: item.host
                });
              }}
            >
              <Text style={styles.listItemText}>
                {item.title} ({item.count}건)
              </Text>
              <View style={styles.actionBadge}>
                <Text style={styles.badgeText}>관리</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3949AB" />
      </View>
    );
  }

  return (
    <Provider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* 헤더 */}
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

          {/* 스크롤 가능한 콘텐츠 */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* 프로필 헤더 */}
              <View style={styles.profileHeader}>
                <View style={styles.profileImageContainer}>
                  {profileData.profile_image ? (
                    <Image source={{ uri: profileData.profile_image }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Ionicons name="person" size={40} color="#7986CB" />
                    </View>
                  )}
                </View>
                
                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>{profileData.username}</Text>
                  <Text style={styles.userInfo}>
                    {profileData.major ?? '학과 없음'} {profileData.grade ? `${profileData.grade}학년` : ''}
                  </Text>
                </View>
              </View>

              {/* 소개글 */}
              <View style={styles.bioSection}>
                <Text style={styles.sectionTitle}>소개글</Text>
                <Text style={styles.introText}>{profileData.bio ?? '소개글이 없습니다.'}</Text>
              </View>

              {/* 신청 목록들 */}
              {profileData && !route.params?.profileUserId && (
                <>
                  {renderMyPendingList()}
                  {renderHostPendingList()}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Provider>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3949AB', // 인디고
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#3949AB', // 인디고 헤더
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#3949AB', // 인디고
    paddingHorizontal: 16, 
    paddingVertical: 12,
  },
  backButton: { 
    padding: 4,
  },
  menuIcon: { 
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: { 
    flex: 1,
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  profileHeader: { 
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E8EAF6', // 연한 인디고
  },
  profileImagePlaceholder: {
    width: 100, 
    height: 100, 
    borderRadius: 50,
    backgroundColor: '#E8EAF6', // 연한 인디고
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: { 
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userInfo: { 
    fontSize: 14, 
    color: '#7986CB', // 연한 인디고
    marginTop: 4,
  },
  bioSection: {
    marginBottom: 16,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  introText: { 
    fontSize: 14, 
    color: '#666',
    lineHeight: 22,
  },
  listSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  listItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    paddingVertical: 12,
    textAlign: 'center',
  },
  pendingBadge: {
    backgroundColor: '#FF9800', // 주황색 (대기)
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionBadge: {
    backgroundColor: '#3949AB', // 인디고
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
