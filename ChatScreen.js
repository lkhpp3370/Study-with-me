import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen() {
  const [chatRooms, setChatRooms] = useState([]);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();

  const fetchChatRooms = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
      const response = await api.get(`/chatroom/user/${storedUserId}`);
      setChatRooms(response.data);
    } catch (err) {
      console.error('채팅방 목록 불러오기 실패:', err.message);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchChatRooms();
      const interval = setInterval(fetchChatRooms, 3000);
      return () => clearInterval(interval);
    }, [])
  );

  const renderItem = ({ item }) => {
    const rawMessage = item.lastMessage || '';
    const isImage = rawMessage?.startsWith('data:image') || rawMessage === '[이미지]';
    const displayMessage = isImage ? '(이미지)' : rawMessage;
    const lastSender = item.lastSenderName || '';
    const displayTime = item.lastMessageAt
      ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity
        style={styles.roomBox}
        onPress={() =>
          navigation.navigate('ChatRoomScreen', {
            roomId: item._id,
            studyTitle: item.studyTitle,
            userId,
          })
        }
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.studyTitle}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.lastMessage}>
          <Text style={styles.senderName}>{lastSender && `${lastSender}: `}</Text>
          {displayMessage}
        </Text>
        <Text style={styles.time}>{displayTime}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>채팅방</Text>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  roomBox: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderRadius: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  senderName: {
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  unreadBadge: {
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
