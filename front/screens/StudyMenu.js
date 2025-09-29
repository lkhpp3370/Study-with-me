import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// onManageStudy prop이 추가되었습니다.
const StudyMenu = ({ 
  isVisible, 
  onClose, 
  isHost, 
  members, 
  onLeaveStudy, 
  hostId, 
  onDelegateHost, 
  onManageStudy,
  onViewProfile
}) => {
  const handleLeaveStudy = () => {
    Alert.alert(
      "스터디 나가기",
      "정말로 스터디를 나가시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      [
        {
          text: "취소",
          onPress: () => console.log("취소"),
          style: "cancel"
        },
        {
          text: "나가기",
          onPress: () => {
            onClose(); // 메뉴 닫기
            onLeaveStudy(); // 🚨 스터디 나가기 로직 실행
          },
          style: "destructive"
        }
      ],
      { cancelable: false }
    );
  };
  
  // 스터디 관리 버튼 핸들러
  const handleManageStudy = () => {
    if (onManageStudy) {
      onManageStudy(); // Studyroommain에서 전달된 네비게이션 함수 호출
    }
  };

  const handleViewProfile = (memberId) => {
    onClose(); // 메뉴 닫기
    if (onViewProfile) {
      onViewProfile(memberId);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>메뉴</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.menuBody}>
            
            {/* 스터디원 목록 제목 부분 */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>스터디원 목록</Text>
              <View style={styles.dropdownIcon}>
                <Ionicons name="chevron-down-outline" size={20} color="#555" />
              </View>
            </View>
            
            {/* 멤버 목록을 실제 데이터로 렌더링 */}
            {members.map((member) => (
              <TouchableOpacity 
                key={member._id} 
                style={styles.memberItem}
                onPress={() => handleViewProfile(member._id)}
              >
                <Ionicons name="person-circle-outline" size={20} color="#555" />
                <Text style={styles.memberName}>{member.username}</Text>
              </TouchableOpacity>
            ))}
            
            {/* 호스트 전용 메뉴 */}
            {isHost && (
              <>
                {/* '스터디 관리' 버튼 */}
                <TouchableOpacity style={styles.menuItem} onPress={handleManageStudy}>
                  <Text style={styles.menuItemText}>스터디 관리</Text>
                </TouchableOpacity>
              </>
            )}

            {/* 공통 메뉴 */}
            <TouchableOpacity style={styles.menuItem} onPress={handleLeaveStudy}>
              <Text style={styles.menuItemText}>스터디 나가기</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: '70%', 
    height: '100%',
    backgroundColor: '#fff',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#001f3f',
    padding: 15,
  },
  menuTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuBody: {
    padding: 15,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  dropdownIcon: {
    marginLeft: 5,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginLeft: 15,
  },
  memberName: {
    marginLeft: 10,
    fontSize: 16,
  },
  acceptButton: {
    marginLeft: 'auto',
    backgroundColor: '#00adf5',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  acceptText: {
    color: '#fff',
  },
});

export default StudyMenu;