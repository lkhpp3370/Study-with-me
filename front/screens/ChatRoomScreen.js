// ✅ ChatRoomScreen.js - 드래그 오류 해결용 TouchableWithoutFeedback 범위 수정
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Modal,
  Image, Keyboard, TouchableWithoutFeedback, SafeAreaView,
  Switch, BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatRoomScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { roomId, studyTitle, userId: routeUserId } = route.params;
  const [userId, setUserId] = useState(routeUserId);
  const [hostId, setHostId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [notificationOn, setNotificationOn] = useState(true);
  const [modalImageUri, setModalImageUri] = useState(null);
  const [noticeInputVisible, setNoticeInputVisible] = useState(false);
  const [noticeText, setNoticeText] = useState('');
  const [voteModalVisible, setVoteModalVisible] = useState(false);
  const [voteQuestion, setVoteQuestion] = useState('');
  const [voteOptions, setVoteOptions] = useState(['', '']);
  const [voteDeadline, setVoteDeadline] = useState(new Date(Date.now() + 86400000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    if (!routeUserId) {
      AsyncStorage.getItem('userId').then((storedId) => {
        if (storedId) setUserId(storedId);
        else alert('유저 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
      });
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchHost();
  }, []);

  useEffect(() => {
    if (userId && roomId) {
      api.get(`/chat/${userId}/notifications`)
        .then(res => {
          const roomSetting = res.data?.[roomId];
          if (typeof roomSetting === 'boolean') setNotificationOn(roomSetting);
        })
        .catch(err => console.error('알림 설정 조회 실패:', err));
    }
  }, [userId, roomId]);

  useEffect(() => {
    if (userId && roomId) {
      api.patch(`/chat/${userId}/notifications`, {
        roomId,
        enabled: notificationOn,
      }).catch(err => console.error('알림 설정 저장 실패:', err));
    }
  }, [notificationOn]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/${roomId}/messages`);
      setMessages(res.data);
      const notice = await api.get(`/chat/${roomId}/notice`);
      setNoticeMessage(notice.data);
    } catch (err) {
      console.error('메시지 불러오기 실패:', err.message);
    }
  };

  const fetchHost = async () => {
    try {
      const res = await api.get(`/chatroom/${roomId}/host`);
      setHostId(res.data.hostId);
    } catch (err) {
      console.error('호스트 정보 불러오기 실패:', err.message);
    }
  };

  const isUserHost = userId && hostId && userId === hostId;

  const sendMessage = async () => {
    if (!text.trim() && !image) return;
    const payload = {
      message: text,
      type: image ? 'image' : 'text',
      roomId,
      senderId: userId,
      image: image || null,
    };
    try {
      await api.post(`/chat/${roomId}`, payload);
      setText('');
      setImage(null);
      fetchMessages();
    } catch (err) {
      console.error('메시지 전송 실패:', err.message);
    }
  };

  const sendNotice = async () => {
    if (!isUserHost) return alert('스터디장이 아닙니다.');
    try {
      await api.post(`/chat/${roomId}/notice`, {
        roomId,
        senderId: userId,
        content: noticeText
      });
      setNoticeInputVisible(false);
      setNoticeText('');
      fetchMessages();
    } catch (err) {
      console.error('공지 작성 실패:', err.message);
    }
  };

  const sendVote = async () => {
    try {
      await api.post(`/chat/${roomId}/vote`, {
        senderId: userId,
        content: voteQuestion,
        voteOptions,
        voteDeadline,
      });
      setVoteModalVisible(false);
      setVoteQuestion('');
      setVoteOptions(['', '']);
      setVoteDeadline(new Date(Date.now() + 86400000));
      fetchMessages();
    } catch (err) {
      console.error('투표 생성 실패:', err.message);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, allowsEditing: true, quality: 0.7 });
    if (!result.canceled) {
      const base64 = result.assets[0].base64;
      setImage(`data:image/jpeg;base64,${base64}`);
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (popupVisible) { setPopupVisible(false); return true; }
      if (noticeInputVisible) { setNoticeInputVisible(false); return true; }
      if (voteModalVisible) { setVoteModalVisible(false); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [popupVisible, noticeInputVisible, voteModalVisible]);

  const renderMessage = ({ item }) => {
    const isMe = item.sender?._id === userId || item.sender === userId;
    if (item.type === 'image') return (
      <TouchableOpacity onPress={() => setModalImageUri(item.content)}>
        <Image source={{ uri: item.content }} style={{ width: 200, height: 200, marginVertical: 10 }} />
      </TouchableOpacity>
    );
    if (item.type === 'poll') {
      const poll = item.poll;
      const question = poll?.question || item.content;
      const options = poll?.options || [];
      const deadlinePassed = poll?.deadline && new Date(poll.deadline) < new Date();
      return (
        <View style={{ backgroundColor: '#eef', padding: 10, marginVertical: 6, borderRadius: 6, maxWidth: '85%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>📊 {question}</Text>
          {options.map((opt, idx) => (
            <TouchableOpacity
              key={idx}
              style={{ paddingVertical: 6, paddingHorizontal: 8, marginVertical: 2, backgroundColor: '#fff', borderRadius: 5 }}
              disabled={deadlinePassed}
              onPress={async () => {
                try {
                  await api.post(`/chat/vote/${item._id}`, { userId, selectedIndex: idx });
                  fetchMessages();
                } catch (e) {
                  alert('투표 실패 또는 이미 참여함');
                }
              }}>
              <Text>- {opt.text} {opt.votes ? `(${opt.votes.length}표)` : ''}</Text>
            </TouchableOpacity>
          ))}
          {deadlinePassed && <Text style={{ marginTop: 4, fontSize: 12, color: 'gray' }}>마감된 투표입니다</Text>}
          {isMe && !deadlinePassed && (
            <TouchableOpacity
              style={{ marginTop: 6, alignSelf: 'flex-end' }}
              onPress={async () => {
                try {
                  await api.post(`/chat/vote/${item._id}/close`);
                  fetchMessages();
                } catch (e) {
                  alert('조기 마감 실패');
                }
              }}>
              <Text style={{ color: 'red', fontSize: 12 }}>⏹️ 투표 조기 마감</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return (
      <View style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', backgroundColor: isMe ? '#dcf8c6' : '#D7E9F7', borderRadius: 8, padding: 8, marginVertical: 4 }}>
        <Text>{item.content?.slice(0, 100)}</Text>
      </View>
    );
  };

  useEffect(() => {
    navigation.setOptions({ title: studyTitle });
  }, [studyTitle]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <SafeAreaView style={styles.container}>
            {noticeMessage && (
              <View style={styles.noticeBar}>
                <Text style={{ fontWeight: 'bold' }}>📌 {noticeMessage.content}</Text>
              </View>
            )}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              style={styles.messageList}
              keyboardShouldPersistTaps="handled"
            />

            <View style={styles.inputBox}>
              <TouchableOpacity onPress={() => setPopupVisible(!popupVisible)}>
                <Ionicons name="add-circle-outline" size={24} color="gray" />
              </TouchableOpacity>
              <TextInput value={text} onChangeText={setText} placeholder="메시지 입력" style={styles.input} />
              <TouchableOpacity onPress={sendMessage}>
                <Ionicons name="send" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            {popupVisible && (
              <View style={styles.popupBox}>
                <View style={styles.popupItem}><Text> 알림</Text><Switch value={notificationOn} onValueChange={setNotificationOn} /></View>
                <View style={styles.divider} />
                <TouchableOpacity onPress={() => setNoticeInputVisible(true)}><Text>공지 작성</Text></TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity onPress={() => setVoteModalVisible(true)}><Text>투표 작성</Text></TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity onPress={handleImagePick}><Text>이미지 보내기</Text></TouchableOpacity>
              </View>
            )}
            <Modal visible={voteModalVisible} transparent={true} animationType="slide" onRequestClose={() => setVoteModalVisible(false)}>
              <TouchableWithoutFeedback onPress={() => setVoteModalVisible(false)}>
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={styles.voteModalBox}>
                      <TextInput value={voteQuestion} onChangeText={setVoteQuestion} placeholder="질문 입력" style={styles.modalInput} />
                      {voteOptions.map((opt, idx) => (
                        <TextInput key={idx} value={opt} onChangeText={(v) => {
                          const newOpts = [...voteOptions]; newOpts[idx] = v; setVoteOptions(newOpts);
                        }} placeholder={`옵션 ${idx + 1}`} style={styles.modalInput} />
                      ))}
                      {voteOptions.length < 8 && (
                        <TouchableOpacity onPress={() => setVoteOptions([...voteOptions, ''])}>
                          <Text>+ 옵션 추가</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ marginVertical: 10 }}>
                        <Text>마감일 선택: {voteDeadline.toLocaleDateString()}</Text>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={voteDeadline}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setVoteDeadline(selectedDate);
                          }}
                        />
                      )}
                      <TouchableOpacity onPress={sendVote}><Text>투표 생성</Text></TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </SafeAreaView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  noticeBar: {
    backgroundColor: '#FFFBE6',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  messageList: { flex: 1, padding: 10 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 8,
  },
  input: {
    flex: 1,
    marginLeft: 8,
  },
  popupBox: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    backgroundColor: 'fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
  },
  popupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteModalBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  modalInput: {
    borderBottomWidth: 1,
    marginBottom: 12,
    paddingVertical: 6
  },
});
