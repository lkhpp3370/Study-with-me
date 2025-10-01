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

/** 마지막 메시지 시간 표시 */
function formatTimeAgo(isoOrDate) {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  const now = new Date();
  const diff = (now - d) / 1000; // sec
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

  /** 로그인 사용자 ID 불러오기 */
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

  /** 채팅방 목록 조회 */
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

  /** 화면 포커스 때마다 새로고침 */
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

  /** 당겨서 새로고침 */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
  }, [fetchRooms]);

  /** 방별 알림 토글 */
  const toggleNotification = async (roomId, enabled) => {
    try {
      await api.patch(`/chatroom/${roomId}/notification`, { userId, enabled });
      // 낙관적 반영
      setRooms(prev =>
        prev.map(r => (r._id === roomId ? { ...r, notifyEnabled: enabled } : r))
      );
    } catch (err) {
      console.error("❌ 알림 토글 실패:", err);
      Alert.alert("오류", "알림 설정을 변경하지 못했습니다.");
    }
  };

  /** 리스트 렌더 */
  const renderItem = ({ item }) => {
    const memberCount = item?.memberCount || 0;   // ✅ members.length 대신 memberCount
    const last = item?.lastMessagePreview || '메시지가 없습니다';
    const timeLabel = item?.lastMessageAt
      ? new Date(item.lastMessageAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      : '';
    const unread = item?.unreadCount || 0;
    const notifyEnabled = item?.notifyEnabled ?? true;

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('채팅방', {
            roomId: item._id,
            studyId: item.studyId,
          })
        }
      >
        {/* 좌측 아이콘 */}
        <View style={styles.leftIcon}>
          <Ionicons name="chatbubble-ellipses" size={22} color="#0a84ff" />
        </View>

        {/* 중앙 정보 */}
        <View style={styles.center}>
          <View style={styles.titleRow}>
            {/* ✅ studyName → studyTitle */}
            <Text style={styles.title} numberOfLines={1}>{item?.studyTitle || '스터디 채팅방'}</Text>
            {!!timeLabel && <Text style={styles.time}>{timeLabel}</Text>}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.meta} numberOfLines={1}>
              {memberCount}명 • {last}
            </Text>
          </View>
        </View>

        {/* 우측: 알림 토글 + 안읽은 배지 */}
        <View style={styles.right}>
          <Text style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>알림</Text>
          {/* ✅ toggleNotification 두 번째 인자로 값 전달 */}
          <Switch
            value={notifyEnabled}
            onValueChange={(val) => toggleNotification(item._id, val)}
          />
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8, color: '#555' }}>채팅방을 불러오는 중…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbox-ellipses-outline" size={28} color="#999" />
            <Text style={{ color: '#999', marginTop: 6 }}>참여 중인 채팅방이 없습니다</Text>
          </View>
        }
        contentContainerStyle={rooms.length === 0 && { flex: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  sep: { height: 8, backgroundColor: '#f6f7fb' },
  leftIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  center: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  time: { fontSize: 12, color: '#888', marginLeft: 8 },
  metaRow: { marginTop: 4 },
  meta: { fontSize: 13, color: '#555' },
  right: { marginLeft: 12, alignItems: 'center' },
  badge: {
    marginTop: 6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
