import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Alert, Dimensions, Modal, ScrollView, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const { width } = Dimensions.get('window');

// ✅ 디자인 미리보기 전용 스위치 (샘플 데이터로 UI만 테스트하고 싶으면 true)
const DESIGN_ONLY = false;

const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  muted: '#94A3B8',
  mutedDark: '#64748B',
  border: '#E2E8F0',
  text: '#0F172A',
  textLight: '#475569',
  shadow: 'rgba(15,23,42,0.08)',
  overlay: 'rgba(15,23,42,0.4)',
};

// 🎯 디자인 모드용 더미 데이터
const SAMPLE_FOLDERS = [
  { _id: 'no-folder', name: '기타', filesCount: 1, owner: 'u1' },
  { _id: 'f-1', name: '1학년', filesCount: 1, owner: 'u1' },
  { _id: 'f-2', name: '공유자료', filesCount: 3, owner: 'u1' },
  { _id: 'f-3', name: '중간고사', filesCount: 1, owner: 'u1' },
];

const SAMPLE_FILES = [
  { _id: 'a1', title: '강의계획서.pdf', folderId: 'f-2', uploader: 'u1', filepath: 'mock/강의계획서.pdf' },
  { _id: 'a2', title: '예제_01.docx', folderId: 'f-2', uploader: 'u1', filepath: 'mock/예제_01.docx' },
  { _id: 'a3', title: '과제양식.hwp', folderId: 'f-1', uploader: 'u1', filepath: 'mock/과제양식.hwp' },
  { _id: 'a4', title: '중간_공식정리.png', folderId: 'f-3', uploader: 'u1', filepath: 'mock/중간_공식정리.png' },
  { _id: 'a5', title: '참고자료.txt', folderId: 'no-folder', uploader: 'u1', filepath: 'mock/참고자료.txt' },
  { _id: 'a6', title: '프로젝트_발표.pptx', folderId: 'f-2', uploader: 'u1', filepath: 'mock/프로젝트_발표.pptx' },
];

// 🔤 파일 확장자 → 아이콘 매핑
const getFileIcon = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map = {
    pdf: { name: 'picture-as-pdf', color: '#EF4444' },
    doc: { name: 'description', color: '#3B82F6' },
    docx: { name: 'description', color: '#3B82F6' },
    hwp: { name: 'description', color: '#10B981' },
    png: { name: 'image', color: '#8B5CF6' },
    jpg: { name: 'image', color: '#8B5CF6' },
    jpeg: { name: 'image', color: '#8B5CF6' },
    ppt: { name: 'slideshow', color: '#F59E0B' },
    pptx: { name: 'slideshow', color: '#F59E0B' },
    txt: { name: 'article', color: '#64748B' },
  };
  return map[ext] || { name: 'insert-drive-file', color: '#64748B' };
};

export default function FileShare({ route }) {
  const insets = useSafeAreaInsets();
  // Android에서 bottom inset이 0으로 나오는 기기가 있어서 최소 여백 보정
  const SAFE_BOTTOM = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 12);

  const studyId = route?.params?.studyId;
  const studyHostId = route?.params?.studyHostId;

  // 상태
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameItemId, setRenameItemId] = useState(null); // "folder-<id>" | "file-<id>"
  const [renameItemName, setRenameItemName] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  // 로그인 사용자 ID 로드
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        setCurrentUserId(id);
      } catch (e) {
        console.warn('Failed to get userId from AsyncStorage');
      }
    };
    getUserId();
  }, []);

  // 서버/샘플 데이터 로드
  const fetchFoldersAndFiles = useCallback(async () => {
    if (DESIGN_ONLY) {
      const list = SAMPLE_FILES.filter(f => (selectedFolderId ? f.folderId === selectedFolderId : true));
      setFolders(SAMPLE_FOLDERS);
      setFiles(list);
      return;
    }

    try {
      // 폴더
      const foldersRes = await api.get(`/studies/${studyId}/folders`);
      const updatedFolders = await Promise.all(
        (foldersRes.data || []).map(async (folder) => {
          const fr = await api.get(`/studies/${studyId}/files?folderId=${folder._id}`);
          return { ...folder, filesCount: fr.data?.length || 0 };
        })
      );
      setFolders(updatedFolders);

      // 파일
      let filesUrl = `/studies/${studyId}/files`;
      if (selectedFolderId) filesUrl += `?folderId=${selectedFolderId}`;
      const filesRes = await api.get(filesUrl);
      setFiles(filesRes.data || []);
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
      Alert.alert('오류', error.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    }
  }, [selectedFolderId, studyId]);

  useEffect(() => {
    if (!DESIGN_ONLY && (!studyId || !route?.params)) {
      console.warn('route.params가 비어 있습니다. DESIGN_ONLY=true로 UI만 먼저 확인하세요.');
    }
    fetchFoldersAndFiles();
  }, [fetchFoldersAndFiles]);

  // 검색 필터
  const filteredFiles = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return (files || []).filter(f => (f?.title || '').toLowerCase().includes(q));
  }, [files, searchQuery]);

  // 폴더 생성
  const confirmAddFolder = async () => {
    const name = newFolderName?.trim();
    if (!name) return Alert.alert('알림', '폴더 이름을 입력하세요.');

    if (DESIGN_ONLY) {
      setFolders(prev => [{ _id: `f-${Date.now()}`, name, filesCount: 0, owner: currentUserId || 'u1' }, ...prev]);
      setShowFolderModal(false);
      setNewFolderName('');
      return;
    }

    try {
      await api.post(`/studies/${studyId}/folders`, { name, userId: currentUserId });
      Alert.alert('폴더 생성 성공', `'${name}' 폴더가 생성되었습니다.`);
      setShowFolderModal(false);
      setNewFolderName('');
      fetchFoldersAndFiles();
    } catch (error) {
      console.error('폴더 생성 실패:', error);
      Alert.alert('폴더 생성 실패', error.response?.data?.message || '알 수 없는 오류');
    }
  };

  // 폴더 삭제
  const handleDeleteFolder = async (folderId, name) => {
    if (!currentUserId && !DESIGN_ONLY) return Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');

    const doDelete = async () => {
      if (DESIGN_ONLY) {
        setFolders(prev => prev.filter(f => f._id !== folderId));
        setFiles(prev => prev.filter(f => f.folderId !== folderId));
        if (selectedFolderId === folderId) setSelectedFolderId(null);
        return;
      }
      try {
        await api.delete(`/studies/${studyId}/folders/${folderId}`, { data: { userId: currentUserId } });
        Alert.alert('삭제 성공', `'${name}' 폴더가 삭제되었습니다.`);
        if (selectedFolderId === folderId) setSelectedFolderId(null);
        fetchFoldersAndFiles();
      } catch (error) {
        console.error('폴더 삭제 실패:', error);
        Alert.alert('삭제 실패', error.response?.data?.message || '알 수 없는 오류');
      }
    };

    Alert.alert('폴더 삭제', `'${name}' 폴더를 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: doDelete },
    ]);
  };

  // 폴더 이름 변경
  const handleRenameFolder = async (id, newName) => {
    const name = newName?.trim();
    if (!name) return Alert.alert('알림', '새 이름을 입력하세요.');
    if (!currentUserId && !DESIGN_ONLY) return Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');

    if (DESIGN_ONLY) {
      setFolders(prev => prev.map(f => (f._id === id ? { ...f, name } : f)));
      return;
    }

    try {
      await api.patch(`/studies/${studyId}/folders/${id}`, { newName: name, userId: currentUserId });
      Alert.alert('이름 변경 성공', '폴더 이름이 변경되었습니다.');
      fetchFoldersAndFiles();
    } catch (error) {
      console.error('폴더 이름 변경 실패:', error);
      Alert.alert('이름 변경 실패', error.response?.data?.message || '알 수 없는 오류');
    }
  };

  // 파일 삭제
  const handleDeleteFile = async (id) => {
    if (!currentUserId && !DESIGN_ONLY) return Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');

    const doDelete = async () => {
      if (DESIGN_ONLY) {
        setFiles(prev => prev.filter(f => f._id !== id));
        return;
      }
      try {
        await api.delete(`/studies/${studyId}/files/${id}`, { data: { userId: currentUserId } });
        Alert.alert('삭제 성공', '파일이 삭제되었습니다.');
        fetchFoldersAndFiles();
      } catch (error) {
        console.error('파일 삭제 실패:', error);
        Alert.alert('삭제 실패', error.response?.data?.message || '알 수 없는 오류');
      }
    };

    Alert.alert('파일 삭제', '이 파일을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: doDelete },
    ]);
  };

  // 파일 이름 변경
  const handleRenameFile = async (id, newName) => {
    const name = newName?.trim();
    if (!name) return Alert.alert('알림', '새 이름을 입력하세요.');
    if (!currentUserId && !DESIGN_ONLY) return Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');

    if (DESIGN_ONLY) {
      setFiles(prev => prev.map(f => (f._id === id ? { ...f, title: name } : f)));
      return;
    }

    try {
      await api.patch(`/studies/${studyId}/files/${id}`, { name, userId: currentUserId });
      Alert.alert('이름 변경 성공', '파일 이름이 변경되었습니다.');
      fetchFoldersAndFiles();
    } catch (error) {
      console.error('파일 이름 변경 실패:', error);
      Alert.alert('이름 변경 실패', error.response?.data?.message || '알 수 없는 오류');
    }
  };

  // 길게 누른 폴더 옵션
  const handleLongPressFolder = (folder) => {
    const isOwner = folder?.owner && folder.owner?.toString() === currentUserId;
    const isStudyHost = studyHostId?.toString() === currentUserId;

    if (!DESIGN_ONLY && !isOwner && !isStudyHost) {
      Alert.alert('권한 없음', '이 폴더를 관리할 권한이 없습니다.');
      return;
    }

    Alert.alert('폴더 옵션', folder.name, [
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          if ((folder.filesCount || 0) > 0 && !DESIGN_ONLY) {
            Alert.alert('경고', '폴더 내에 파일이 있어 삭제할 수 없습니다.');
          } else {
            handleDeleteFolder(folder._id, folder.name);
          }
        },
      },
      {
        text: '이름 변경',
        onPress: () => {
          setRenameItemId(`folder-${folder._id}`);
          setRenameItemName(folder.name);
          setShowRenameModal(true);
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  // 길게 누른 파일 옵션
  const handleLongPressFile = (file) => {
    const isUploader = file?.uploader && file.uploader?.toString() === currentUserId;
       const isStudyHost = studyHostId?.toString() === currentUserId;

    if (!DESIGN_ONLY && !isUploader && !isStudyHost) {
      Alert.alert('알림', '권한이 없습니다.');
      return;
    }

    const openRename = () => {
      if (Platform.OS === 'ios') {
        Alert.prompt('파일 이름 변경', '새로운 이름을 입력하세요.', [
          { text: '취소', style: 'cancel' },
          { text: '확인', onPress: (n) => n && handleRenameFile(file._id, n) },
        ]);
      } else {
        setRenameItemId(`file-${file._id}`);
        setRenameItemName(file.title);
        setShowRenameModal(true);
      }
    };

    Alert.alert('파일 옵션', file.title, [
      { text: '삭제', style: 'destructive', onPress: () => handleDeleteFile(file._id) },
      { text: '이름 변경', onPress: openRename },
      { text: '취소', style: 'cancel' },
    ]);
  };

  // 업로드
  const handleUpload = async () => {
    if (DESIGN_ONLY) return Alert.alert('디자인 모드', '업로드 기능은 비활성화되어 있습니다.');
    if (!currentUserId) return Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');

    if (!selectedFolderId) {
      if ((folders?.length || 0) === 0) {
        Alert.alert(
          '폴더가 없습니다',
          '업로드하려면 먼저 폴더를 만들어 주세요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '폴더 만들기', onPress: () => setShowFolderModal(true) },
          ]
        );
      } else {
        Alert.alert('폴더 선택 필요', '파일을 업로드할 폴더를 먼저 선택해 주세요.');
      }
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const { uri, name, mimeType } = file;
      

      const formData = new FormData();
      formData.append('title', name);
      formData.append('file', { uri, name, type: mimeType || 'application/octet-stream' });
      formData.append('folderId', selectedFolderId);
      formData.append('uploader', currentUserId);

      await api.post(`/studies/${studyId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      Alert.alert('업로드 성공', '파일이 업로드되었습니다.');
      fetchFoldersAndFiles();
    } catch (error) {
      console.error('업로드 실패:', error);
      Alert.alert('업로드 실패', error.response?.data?.message || '알 수 없는 오류');
    }
  };

  // 파일 열기
  const openFile = (item) => {
    if (DESIGN_ONLY) return Alert.alert('미리보기', '디자인 모드에서는 열 수 없습니다.');
    if (!item?.filepath) return Alert.alert('오류', '파일 경로가 없습니다.');
    const fileUrl = `${api.defaults.baseURL}/${item.filepath.replace(/\\/g, '/')}`;
    Linking.openURL(fileUrl).catch(() => Alert.alert('오류', '파일을 열 수 없습니다.'));
  };

  // 컴포넌트들 (UI)
  const FolderCard = ({ item }) => {
    const isSelected = selectedFolderId === item._id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedFolderId(isSelected ? null : item._id)}
        onLongPress={() => handleLongPressFolder(item)}
        style={[styles.folderCard, isSelected && styles.folderCardSelected]}
      >
        <View style={[styles.folderIconWrap, isSelected && styles.folderIconWrapSelected]}>
          <Icon name="folder" size={24} color={isSelected ? COLORS.primary : COLORS.mutedDark} />
        </View>
        <Text style={[styles.folderName, isSelected && styles.folderNameSelected]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.folderCount}>{item.filesCount ?? 0}</Text>
      </TouchableOpacity>
    );
  };

  const FileCard = ({ item }) => {
    const fileIcon = getFileIcon(item.title);
    return (
      <TouchableOpacity
        onPress={() => openFile(item)}
        onLongPress={() => handleLongPressFile(item)}
        style={styles.fileCard}
      >
        <View style={[styles.fileIconWrap, { backgroundColor: `${fileIcon.color}15` }]}>
          <Icon name={fileIcon.name} size={28} color={fileIcon.color} />
        </View>
        <Text style={styles.fileName} numberOfLines={2}>{item.title || '이름 없음'}</Text>
      </TouchableOpacity>
    );
  };

  // 이름변경 모달 제출
  const handleRenameSubmit = async () => {
    const name = renameItemName?.trim();
    if (!name) return Alert.alert('알림', '이름을 입력하세요.');

    try {
      if (renameItemId?.startsWith('folder-')) {
        const id = renameItemId.replace('folder-', '');
        await handleRenameFolder(id, name);
      } else if (renameItemId?.startsWith('file-')) {
        const id = renameItemId.replace('file-', '');
        await handleRenameFile(id, name);
      }
      setShowRenameModal(false);
      setRenameItemName('');
    } catch {
      // 내부 Alert로 처리됨
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingBottom: SAFE_BOTTOM }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>자료 공유</Text>
        {DESIGN_ONLY && (
          <View style={styles.badge}><Text style={styles.badgeText}>미리보기</Text></View>
        )}
      </View>

      {/* 검색 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="파일 또는 폴더 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 목록 */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SAFE_BOTTOM + 96 }} // FAB 높이만큼 여유
      >
        {/* 폴더 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>폴더</Text>
            <Text style={styles.sectionCount}>{folders.length}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderScroll}>
            {folders.map(f => <FolderCard key={f._id} item={f} />)}
          </ScrollView>
        </View>

        {/* 파일 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>파일</Text>
            <Text style={styles.sectionCount}>{filteredFiles.length}</Text>
          </View>
          {filteredFiles.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyText}>파일이 없습니다</Text>
              <Text style={styles.emptySubtext}>파일을 업로드해보세요</Text>
            </View>
          ) : (
            <View style={styles.fileGrid}>
              {filteredFiles.map(f => <FileCard key={f._id} item={f} />)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 플로팅 버튼 */}
      <View style={[styles.fabContainer, { bottom: SAFE_BOTTOM + 12 }]}>
        <TouchableOpacity style={styles.fabSecondary} onPress={() => setShowFolderModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="folder-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabPrimary} onPress={handleUpload} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
          <Text style={styles.fabText}>업로드</Text>
        </TouchableOpacity>
      </View>

      {/* 폴더 생성 모달 */}
      <Modal visible={showFolderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 20 + SAFE_BOTTOM }]}>
            <Text style={styles.modalTitle}>새 폴더 만들기</Text>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="폴더 이름"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowFolderModal(false)}>
                <Text>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={confirmAddFolder}>
                <Text style={{ color: '#fff' }}>만들기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 이름 변경 모달 (Android/공통) */}
      <Modal visible={showRenameModal} transparent animationType="fade" onRequestClose={() => setShowRenameModal(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.renameModal, { paddingBottom: 20 + SAFE_BOTTOM }]}>
            <Text style={styles.modalTitle}>이름 변경</Text>
            <TextInput
              value={renameItemName}
              onChangeText={setRenameItemName}
              placeholder="새로운 이름"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowRenameModal(false)}>
                <Text>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleRenameSubmit}>
                <Text style={{ color: '#fff' }}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CARD_GAP = 10;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg }, // paddingBottom은 런타임에서 주입
  header: { alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  badge: { position: 'absolute', right: 16, top: 18, backgroundColor: COLORS.primary, paddingHorizontal: 8, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11 },

  searchContainer: { paddingHorizontal: 16, paddingBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, height: 48, gap: 8, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: 16 },

  content: { flex: 1 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  sectionCount: { fontSize: 14, color: COLORS.muted },

  folderScroll: { paddingHorizontal: 16, flexDirection: 'row', gap: 12 },
  folderCard: { width: 120, backgroundColor: COLORS.card, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  folderCardSelected: { borderColor: COLORS.primary, borderWidth: 1.5, backgroundColor: '#EEF2FF' },
  folderIconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  folderIconWrapSelected: { backgroundColor: `${COLORS.primary}15` },
  folderName: { marginTop: 8, fontSize: 13, color: COLORS.text },
  folderNameSelected: { color: COLORS.primary },
  folderCount: { marginTop: 4, fontSize: 11, color: COLORS.muted },

  fileGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: CARD_GAP },
  fileCard: { width: (width - 48 - CARD_GAP * 2) / 3, alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: COLORS.border },
  fileIconWrap: { width: 50, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 12, textAlign: 'center', marginTop: 6, color: COLORS.text },

  // ✅ 추가된 빈 상태 스타일
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '700',
  },
  emptySubtext: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.muted,
  },

  fabContainer: { position: 'absolute', right: 20, flexDirection: 'row', gap: 10 }, // bottom은 런타임에서 주입
  fabPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 16, borderRadius: 24, height: 48, gap: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  fabSecondary: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card },
  fabText: { color: '#fff', fontWeight: '700' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay },
  modalOverlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.overlay },
  modalContent: { backgroundColor: COLORS.card, padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  renameModal: { backgroundColor: COLORS.card, padding: 20, borderRadius: 16, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: COLORS.text },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, marginBottom: 16, backgroundColor: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalButtonCancel: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  modalButtonConfirm: { flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', padding: 12, borderRadius: 10 },
});
