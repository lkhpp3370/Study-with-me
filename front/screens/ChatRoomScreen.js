//수정완료
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textLight: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};

function formatTimeAgo(isoOrDate) {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${hh}:${mm}`;
}

export default function ChatRoomScreen() {
  const navigation = useNavigation();

  const [userId, setUserId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserId = useCallback(async () => {
    const stored =
      (await AsyncStorage.getItem('userId')) ||
      (await AsyncStorage.getItem('currentUserId'));
    if (!stored) {
      Alert.alert('로그인이 필요합니다');
      navigation.navigate('Login');
      return null;
    }
    setUserId(stored);
    return stored;
  }, [navigation]);

  const fetchRooms = useCallback(
    async (uid) => {
      try {
        const id = uid || userId || (await loadUserId());
        if (!id) return;

        const res = await api.get(`/chatroom/user/${id}`);
        setRooms(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('채팅방 목록 로드 실패:', err?.response?.data || err.message);
        Alert.alert('오류', '채팅방 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadUserId, userId]
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const id = await loadUserId();
        if (mounted) await fetchRooms(id);
      })();
      return () => {
        mounted = false;
      };
    }, [fetchRooms, loadUserId])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
  }, [fetchRooms]);

  const toggleNotification = async (roomId, enabled) => {
    try {
      await api.patch(`/chatroom/${roomId}/notification`, { userId, enabled });
      setRooms(prev =>
        prev.map(r => (r._id === roomId ? { ...r, notifyEnabled: enabled } : r))
      );
    } catch (err) {
      console.error("❌ 알림 토글 실패:", err);
      Alert.alert("오류", "알림 설정을 변경하지 못했습니다.");
    }
  };

  const renderItem = ({ item }) => {
    const memberCount = item?.memberCount || 0;
    const last = item?.lastMessagePreview || '메시지가 없습니다';
    const timeLabel = formatTimeAgo(item?.lastMessageAt);
    const unread = item?.unreadCount || 0;
    const notifyEnabled = item?.notifyEnabled ?? true;

    return (
      <TouchableOpacity
        style={styles.chatCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('채팅방', {
            roomId: item._id,
            studyId: item.studyId,
          })
        }
      >
        <View style={styles.chatLeft}>
          <View style={styles.avatarWrap}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>

          <View style={styles.chatInfo}>
            <View style={styles.chatTitleRow}>
              <Text style={styles.chatTitle} numberOfLines={1}>
                {item?.studyTitle || '스터디 채팅방'}
              </Text>
              <View style={styles.memberBadge}>
                <Ionicons name="person" size={10} color={COLORS.muted} />
                <Text style={styles.memberCount}>{memberCount}</Text>
              </View>
            </View>

            <Text style={styles.lastMessage} numberOfLines={1}>
              {last}
            </Text>

            <View style={styles.metaRow}>
              {!!timeLabel && (
                <View style={styles.timeChip}>
                  <Ionicons name="time-outline" size={12} color={COLORS.muted} />
                  <Text style={styles.timeText}>{timeLabel}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.chatRight}>
          <View style={styles.notifyToggle}>
            <Ionicons 
              name={notifyEnabled ? 'notifications' : 'notifications-off'} 
              size={18} 
              color={notifyEnabled ? COLORS.primary : COLORS.muted} 
            />
            <Switch
              value={notifyEnabled}
              onValueChange={(val) => toggleNotification(item._id, val)}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={notifyEnabled ? COLORS.primary : '#f4f3f4'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>채팅방을 불러오는 중</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{rooms.length}</Text>
        </View>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          rooms.length === 0 && styles.listContentEmpty
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles-outline" size={56} color={COLORS.muted} />
            </View>
            <Text style={styles.emptyTitle}>채팅방이 없습니다</Text>
            <Text style={styles.emptyDesc}>
              스터디에 가입하면{'\n'}자동으로 채팅방이 생성됩니다
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flex: 1,
  },
  separator: {
    height: 12,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  chatInfo: {
    flex: 1,
  },
  chatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  memberCount: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  chatRight: {
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  notifyToggle: {
    alignItems: 'center',
    gap: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});