import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { io } from 'socket.io-client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const socket = io('http://192.168.45.173:3000');

export default function ChatRoomScreen({ route }) {
  const { roomId } = route.params;
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [senderId, setSenderId] = useState(null);

  const fetchMessages = async (storedId) => {
    try {
      const res = await axios.get(`http://192.168.45.173:3000/chat/${roomId}/messages`);
      setMessages(res.data);
      await axios.patch(`http://192.168.45.173:3000/chat/${roomId}/read`, { userId: storedId });
    } catch (err) {
      console.error('메시지 불러오기 실패:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) return;
      setSenderId(storedId);
      socket.emit('joinRoom', roomId);

      const roomRes = await axios.get(`http://192.168.45.173:3000/chatroom/${roomId}`);
      navigation.setOptions({ title: roomRes.data.studyId.title });

      await fetchMessages(storedId);
    };
    init();
  }, []);

  useEffect(() => {
    if (!senderId) return;
    socket.on('receiveMessage', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });
    return () => socket.off('receiveMessage');
  }, [senderId]);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        if (senderId) fetchMessages(senderId);
      }, 3000);
      return () => clearInterval(interval);
    }, [senderId])
  );

  const sendMessage = () => {
    if (!text.trim() || !senderId) return;
    socket.emit('sendMessage', {
      roomId,
      senderId,
      message: text.trim(),
    });
    setText('');
  };

  const renderItem = ({ item }) => {
    const isMine = item.sender === senderId || item.sender?._id === senderId;
    return (
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
        {!isMine && <Text style={styles.sender}>{item.sender?.username}</Text>}
        <Text>{item.content}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="메시지를 입력하세요"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendText}>전송</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  messageList: { padding: 16 },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  sender: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  time: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBox: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
    padding: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 20,
  },
  sendText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
