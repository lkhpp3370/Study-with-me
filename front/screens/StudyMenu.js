import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [isMemberListExpanded, setIsMemberListExpanded] = useState(true);

  const handleLeaveStudy = () => {
    Alert.alert(
      "스터디 나가기",
      "정말로 스터디를 나가시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      [
        {
          text: "취소",
          style: "cancel"
        },
        {
          text: "나가기",
          onPress: () => {
            onClose();
            onLeaveStudy();
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleManageStudy = () => {
    if (onManageStudy) {
      onManageStudy();
    }
  };

  const handleViewProfile = (memberId) => {
    onClose();
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
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <View style={styles.menuHeaderLeft}>
              <Ionicons name="menu" size={24} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.menuTitle}>메뉴</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.menuBody}
            showsVerticalScrollIndicator={false}
          >
            {/* 스터디원 목록 */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => setIsMemberListExpanded(!isMemberListExpanded)}
              >
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="people" size={20} color="#4C63D2" style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>스터디원 목록</Text>
                  <View style={styles.memberCountBadge}>
                    <Text style={styles.memberCountText}>{members.length}</Text>
                  </View>
                </View>
                <Ionicons 
                  name={isMemberListExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#4C63D2" 
                />
              </TouchableOpacity>
              
              {isMemberListExpanded && (
                <View style={styles.memberList}>
                  {members.map((member) => {
                    const isMemberHost = member._id === hostId;
                    return (
                      <TouchableOpacity 
                        key={member._id} 
                        style={styles.memberItem}
                        onPress={() => handleViewProfile(member._id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.memberLeft}>
                          <View style={[styles.memberAvatar, isMemberHost && styles.hostAvatar]}>
                            <Ionicons 
                              name={isMemberHost ? "star" : "person"} 
                              size={18} 
                              color={isMemberHost ? "#FFD700" : "#4C63D2"} 
                            />
                          </View>
                          <View style={styles.memberInfo}>
                            <Text style={styles.memberName}>{member.username}</Text>
                            {isMemberHost && (
                              <View style={styles.hostBadge}>
                                <Text style={styles.hostBadgeText}>스터디장</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#999" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 스터디 관리 (호스트만) */}
            {isHost && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>관리</Text>
                <TouchableOpacity 
                  style={styles.menuActionItem}
                  onPress={handleManageStudy}
                >
                  <View style={styles.actionLeft}>
                    <View style={[styles.actionIcon, { backgroundColor: '#E8EAFF' }]}>
                      <Ionicons name="settings" size={20} color="#4C63D2" />
                    </View>
                    <Text style={styles.menuActionText}>스터디 관리</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            )}

            {/* 나가기 */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.menuActionItem}
                onPress={handleLeaveStudy}
              >
                <View style={styles.actionLeft}>
                  <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="exit-outline" size={20} color="#FF5B5B" />
                  </View>
                  <Text style={[styles.menuActionText, { color: '#FF5B5B' }]}>스터디 나가기</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
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
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4C63D2',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  menuBody: {
    flex: 1,
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 12,
  },
  memberCountBadge: {
    backgroundColor: '#4C63D2',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  memberList: {
    marginTop: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8EAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hostAvatar: {
    backgroundColor: '#FFF9E5',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  hostBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hostBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B6914',
  },
  menuActionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});

export default StudyMenu;
