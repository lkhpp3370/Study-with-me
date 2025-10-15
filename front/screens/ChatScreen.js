// screens/ChatScreen.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  Keyboard,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import api from '../services/api';
import { BACKEND_URL } from '@env';

const SOCKET_URL = BACKEND_URL;
const BASE_URL = (BACKEND_URL || '').replace(/\/$/, '');
const normPath = (p) => encodeURI(String(p || '').replace(/^\/+/, '').replace(/\\/g,'/'));

function LongText({ text, textStyle, maxChars = 180 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const tooLong = text.length > maxChars;
  const show = expanded || !tooLong ? text : (text.slice(0, maxChars) + '…');
  return (
    <View>
      <Text style={textStyle}>{show}</Text>
      {tooLong && (
        <TouchableOpacity onPress={() => setExpanded(v => !v)} style={{ marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: '#007aff' }}>{expanded ? '접기' : '더보기'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { roomId, studyId } = route.params;

  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [imgModal, setImgModal] = useState({ visible: false, uri: null });


  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  /** 로그인 유저 ID 불러오기 */
  const loadUserId = useCallback(async () => {
    const stored =
      (await AsyncStorage.getItem('userId')) ||
      (await AsyncStorage.getItem('currentUserId'));
    setUserId(stored);
    return stored;
  }, []);

  /** 메시지 목록 불러오기 */
  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/chat/${roomId}/messages`);
      const data = res.data || [];
      setMessages(data);

      // ✅ 스크롤 위치 결정
      setTimeout(async () => {
        const myId = userId || (await loadUserId());
        if (!myId) return;

        const firstUnreadIndex = data.findIndex(
          (m) => !(m.readBy || []).some((id) => String(id) === String(myId))
        );

        if (firstUnreadIndex >= 0) {
          flatListRef.current?.scrollToIndex({
            index: firstUnreadIndex,
            animated: true,
            viewPosition: 0.5, // 화면 중간쯤
          });
        } else {
          flatListRef.current?.scrollToEnd({ animated: false });
        }
      }, 200);
    } catch (err) {
      console.error('메시지 로드 실패:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId, userId, loadUserId]);


  const markAllAsRead = useCallback(async () => {
    const myId = userId || (await loadUserId());
    if (!myId) return;
    try {
      await api.patch(`/chat/${roomId}/readAll`, { userId: myId });
    } catch (err) {
      console.error('❌ 전체 읽음 실패:', err?.response?.data || err.message);
    }
  }, [roomId, userId, loadUserId]);

  /** 소켓 연결 */
  useEffect(() => {
    (async () => {
      const id = await loadUserId();
      if (!id) return;

      socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
      socketRef.current.emit('joinRoom', roomId);

      socketRef.current.on('receiveMessage', (msg) => {
        setMessages((prev) => (prev.some(m => m._id === msg._id) ? prev : [...prev, msg]));
        flatListRef.current?.scrollToEnd({ animated: true });
      });

      // ✅ readBy를 가짜 배열로 덮어쓰지 않고 readCount만 갱신
      socketRef.current.on('updateReadCount', ({ messageId, readCount }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...m, readCount } : m
          )
        );
      });

      socketRef.current.on('pinnedUpdated', ({ pinned }) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === pinned ? { ...m, __pinned: true } : { ...m, __pinned: false }))
        );
      });
    })();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, loadUserId]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => showSub.remove();
  }, []);

  /** 포커스될 때마다 메시지 리로드 + 읽음 처리 */
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const info = await api.get(`/chatroom/${roomId}`);
          if (active) setMemberCount(info.data?.memberCount || 0);
        } catch {}        
        await fetchMessages();
        const id = userId || (await loadUserId());
        if (active && id) {
          await markAllAsRead();
        }
      })();
      return () => { active = false; };
    }, [fetchMessages, roomId, userId])
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8, color: '#555' }}>메시지를 불러오는 중…</Text>
      </View>
    );
  }

  // 이미지 확대 모달
  const ImagePreviewModal = () => (
    <Modal visible={imgModal.visible} transparent animationType="fade" onRequestClose={() => setImgModal({visible:false, uri:null})}>
      <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.9)', alignItems:'center', justifyContent:'center'}}>
        <TouchableOpacity style={{position:'absolute', top:40, right:20, padding:10}} onPress={() => setImgModal({visible:false, uri:null})}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        {!!imgModal.uri && (
          <Image source={{ uri: imgModal.uri }} style={{ width:'90%', height:'70%' }} resizeMode="contain" />
        )}
        <TouchableOpacity onPress={() => Linking.openURL(imgModal.uri)} style={{marginTop:16}}>
          <Text style={{color:'#fff', textDecorationLine:'underline'}}>이미지 다운로드</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  /** ✅ 텍스트 메시지 전송 */
  const sendTextMessage = async () => {
    if (!input.trim()) return;
    try {
      await api.post(`/chat/${roomId}/messages`, {
        senderId: userId,
        type: 'text',
        content: input,
      });
      setInput('');
    } catch (err) {
      console.error('텍스트 메시지 전송 실패:', err.message);
    }
  };

  /** ✅ 이미지 업로드 후 메시지 전송 */
  const pickAndSendImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 10,
      });

      if (result.canceled) return;

      const files = result.assets || [result];
      const formData = new FormData();
      formData.append('senderId', userId);
      files.forEach((file) => {
        formData.append('files', {
          uri: file.uri,
          type: 'image/jpeg',
          name: file.fileName || `photo_${Date.now()}.jpg`,
        });
      });

      await api.post(`/chat/${roomId}/messages/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    } catch (err) {
      console.error('이미지 업로드 실패:', err.message);
      Alert.alert('오류', '이미지를 전송하지 못했습니다.');
    }
  };

  /** ✅ 투표 메시지 전송 */
  const sendPollMessage = async (question, options, deadline) => {
    try {
      const pollData = {
        question,
        options: options.map((opt) => ({ text: opt, votes: [] })),
        deadline,
      };
      await api.post(`/chat/${roomId}/messages`, { senderId: userId, type: 'poll', poll: pollData });
    } catch (err) {
      console.error('투표 전송 실패:', err.message);
      Alert.alert('오류', '투표를 전송하지 못했습니다.');
    }
  };

  /** ✅ 메시지 고정 */
  const pinMessage = async (messageId) => {
    try {
      await api.post(`/chat/${roomId}/messages/${messageId}/pin`);
      socketRef.current.emit('pinnedUpdated', { pinned: messageId });
      Alert.alert('공지', '메시지가 고정되었습니다.');
    } catch (err) {
      console.error('메시지 고정 실패:', err.message);
      Alert.alert('오류', '메시지를 고정하지 못했습니다.');
    }
  };

  /** ✅ 메시지 UI 렌더링 */
  const renderMessage = ({ item }) => {
    const isMine = item.sender?._id === userId || item.sender === userId;
    const bubbleStyle = isMine ? styles.myBubble : styles.otherBubble;
    const textStyle = isMine ? styles.myText : styles.otherText;

    const isPinned = item.__pinned || false;

    return (
      <View style={[styles.messageRow, isMine && { justifyContent: 'flex-end' }]}>
        <View style={[styles.bubble, bubbleStyle]}>
          {isPinned && (
            <View style={styles.pinnedTag}>
              <Ionicons name="pin" size={14} color="#ff9500" />
              <Text style={{ fontSize: 12, color: '#ff9500', marginLeft: 4 }}>공지</Text>
            </View>
          )}

          {item.type === 'text' && (
            <LongText text={item.content} textStyle={textStyle} maxChars={180} />
          )}

          {item.type === 'image' && (
            <TouchableOpacity 
              onPress={() => setImgModal({ visible: true, uri: `${BASE_URL}/${normPath(item.content)}` })}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: `${BASE_URL}/${normPath(item.content)}` }}
                style={{ width: 160, height: 120, borderRadius: 8, backgroundColor:'#ddd' }}
                resizeMode="cover"
                onLoadEnd={() => {
                  // 이미지가 다 로드되면 스크롤 위치 재조정
                  if (messages.length && item._id === messages[messages.length - 1]._id) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }
                }}
              />
            </TouchableOpacity>
          )}

          {item.type === 'file' && (
            <TouchableOpacity style={styles.fileBox} onPress={() => Alert.alert('파일', '다운로드 기능 구현 필요')}>
              <Ionicons name="document" size={18} color="#007aff" />
              <Text style={styles.fileText}>{item.content.split('/').pop()}</Text>
            </TouchableOpacity>
          )}

          {item.type === 'poll' && (
            <View style={styles.pollBox}>
              <Text style={styles.pollQuestion}>{item.poll?.question}</Text>
              {(() => {
                const dl = item.poll?.deadline ? new Date(item.poll.deadline) : null;
                const isClosed = dl ? Date.now() > dl.getTime() : false;
                return (
                  <>
                    {item.poll?.options?.map((opt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.pollOption, isClosed && {opacity:0.5}]}
                        disabled={isClosed}
                        onPress={() => votePollLocal(item._id, idx)}
                      >
                        <Text style={styles.pollOptionText}>
                          {opt.text} ({opt.votes?.length || 0})
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <Text style={styles.pollDeadline}>
                      {dl ? `마감: ${dl.toLocaleString()}` : '마감 정보 없음'}
                      {isClosed ? ' (마감됨)' : ''}
                    </Text>
                  </>
                );
              })()}
            </View>
          )}
        </View>

        {!isMine && (
          <Text style={[styles.senderName, { alignSelf: 'flex-start', marginLeft: 4 }]}>
            {item.sender?.username || '익명'}
          </Text>
        )}
        {isMine && typeof item.readCount === 'number' && memberCount > 0 && (
          <Text style={{fontSize:10, color:'#666', marginLeft:6}}>
            {Math.max(memberCount - item.readCount, 0)}
          </Text>
        )}        
      </View>
    );
  };

  /** ✅ 투표 참여 */
  const votePollLocal = async (messageId, optionIndex) => {
    // 1) UI 즉시 반영
    setMessages(prev => prev.map(m => {
      if (m._id !== messageId) return m;
      const copy = JSON.parse(JSON.stringify(m));
      // 중복 투표 제거 후 선택 옵션에 추가
      copy.poll.options.forEach(o => {
        o.votes = (o.votes || []).filter(v => String(v) !== String(userId));
      });
      (copy.poll.options[optionIndex].votes ||= []).push(userId);
      return copy;
    }));
    // 2) 서버 호출 (실패 시 롤백은 생략, 에러만 노출)
    try {
      await api.post(`/chat/${roomId}/poll/${messageId}/vote`, { userId, optionIndex });
    } catch (err) {
      Alert.alert('오류', '투표에 실패했습니다.');
      console.error('투표 실패:', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
    >
      <ImagePreviewModal />
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={<View style={{ height: 60 }} />}
      />


      <View style={styles.inputRow}>
        <TouchableOpacity onPress={pickAndSendImage} style={styles.iconBtn}>
          <Ionicons name="image-outline" size={22} color="#007aff" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="메시지를 입력하세요"
          value={input}
          onChangeText={setInput}
          multiline
          blurOnSubmit={false}
          returnKeyType="default"
          onSubmitEditing={() => setInput((prev) => prev + '\n')}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Enter') {
              setInput((prev) => prev + '\n');
            }
          }}
        />
        <TouchableOpacity onPress={sendTextMessage} style={styles.sendBtn}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  messageRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 12 },
  myBubble: { backgroundColor: '#007aff', borderTopRightRadius: 0 },
  otherBubble: { backgroundColor: '#e5e5ea', borderTopLeftRadius: 0 },
  myText: { color: '#fff', fontSize: 15 },
  otherText: { color: '#000', fontSize: 15 },
  senderName: { fontSize: 11, color: '#555', marginLeft: 6, marginBottom: 2 },

  pinnedTag: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },

  fileBox: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#fff', padding: 6, borderRadius: 6 },
  fileText: { marginLeft: 6, color: '#007aff', fontSize: 14 },

  pollBox: { marginTop: 4, backgroundColor: '#fff', padding: 8, borderRadius: 6 },
  pollQuestion: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  pollOption: { padding: 6, borderRadius: 4, backgroundColor: '#f1f1f1', marginVertical: 2 },
  pollOptionText: { fontSize: 14, color: '#333' },
  pollDeadline: { fontSize: 12, color: '#888', marginTop: 4 },

  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd', position: 'absolute', bottom: 0, left: 0, right: 0 },
  iconBtn: { padding: 6, marginRight: 4 },
  input: { flex: 1, backgroundColor: '#f1f1f1', borderRadius: 20, paddingHorizontal: 12, fontSize: 15, textAlignVertical: 'top'},
  sendBtn: { marginLeft: 6, backgroundColor: '#007aff', borderRadius: 20, padding: 8 },
});
