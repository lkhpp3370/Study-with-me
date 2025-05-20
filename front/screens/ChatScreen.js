import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen() {
  const [chatRooms, setChatRooms] = useState([]);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();

  const fetchChatRooms = async () => {
    try {
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) {
        console.error('❌ userId 없음');
        return;
      }
      setUserId(storedId);
      const res = await axios.get(`http://192.168.45.173:3000/chatroom/user/${storedId}`);
      setChatRooms(res.data);
    } catch (err) {
      console.error('채팅방 목록 불러오기 실패:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChatRooms(); // 첫 로딩
      const interval = setInterval(fetchChatRooms, 3000); // 3초 주기
      return () => clearInterval(interval);
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => navigation.navigate('ChatRoomScreen', { roomId: item._id })}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.studyTitle}>{item.studyId.title}</Text>
        {item.unreadCount > 0 && <Text style={styles.badge}>{item.unreadCount}</Text>}
      </View>
      <Text style={styles.lastMessageSender}>
        {item.lastMessageSender ? `${item.lastMessageSender}:` : ''}
      </Text>
      <Text style={styles.lastMessage} numberOfLines={1}>
        {item.lastMessage || '대화를 시작해보세요'}
      </Text>
      <Text style={styles.time}>{new Date(item.lastMessageAt).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContainer: { padding: 16 },
  roomItem: {
    padding: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studyTitle: { fontSize: 16, fontWeight: 'bold' },
  badge: {
    backgroundColor: '#ff3b30',
    color: 'white',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
  },
  lastMessageSender: { fontSize: 13, color: '#555', marginTop: 6 },
  lastMessage: { fontSize: 14, color: '#444', marginTop: 2 },
  time: { fontSize: 12, color: '#999', marginTop: 4 },
});
