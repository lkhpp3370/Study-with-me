import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Alert, Dimensions, Modal, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const FileShare = ({ route }) => {
  const { studyId, studyHostId } = route.params;
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameItemId, setRenameItemId] = useState(null);
  const [renameItemName, setRenameItemName] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null); // 💡 추가: 현재 사용자 ID 상태

  // 💡 추가: 컴포넌트 로드 시 AsyncStorage에서 userId를 가져옵니다.
  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id);
    };
    getUserId();
  }, []);
  
  const fetchFoldersAndFiles = useCallback(async () => {
    try {
      const foldersResponse = await api.get(`/studies/${studyId}/folders`);
      // 💡 변경: 각 폴더에 filesCount를 계산하여 추가
      const updatedFolders = await Promise.all(
        foldersResponse.data.map(async (folder) => {
          const filesResponse = await api.get(`/studies/${studyId}/files?folderId=${folder._id}`);
          return { ...folder, filesCount: filesResponse.data.length };
        })
      );
      setFolders(updatedFolders);

      let filesUrl = `/studies/${studyId}/files`;
      if (selectedFolderId) {
        filesUrl += `?folderId=${selectedFolderId}`;
      }
      
      const filesResponse = await api.get(filesUrl);
      setFiles(filesResponse.data);
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
      Alert.alert('오류', error.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    }
  }, [selectedFolderId, studyId]);

  useEffect(() => {
    fetchFoldersAndFiles();
  }, [fetchFoldersAndFiles]);

  const filteredFiles = files.filter(file => {
    if (!file || !file.title) return false;
    const title = String(file.title).toLowerCase();
    const query = String(searchQuery || '').toLowerCase();
    return title.includes(query);
  });

  const confirmAddFolder = async () => {
    if (newFolderName && newFolderName.trim()) {
      try {
        await api.post(`/studies/${studyId}/folders`, { name: newFolderName.trim(), userId: currentUserId });
        Alert.alert('폴더 생성 성공', `'${newFolderName.trim()}' 폴더가 생성되었습니다.`);
        setShowFolderModal(false);
        setNewFolderName('');
        fetchFoldersAndFiles();
      } catch (error) {
        console.error('폴더 생성 실패:', error);
        Alert.alert('폴더 생성 실패', error.response?.data?.message || '알 수 없는 오류');
      }
    } else {
      Alert.alert('알림', '폴더 이름을 입력하세요.');
    }
  };

  const handleRenameSubmit = async () => {
    if (renameItemName && renameItemName.trim()) {
      try {
        if (renameItemId.startsWith('folder')) {
          const folderId = renameItemId.replace('folder-', '');
          await handleRenameFolder(folderId, renameItemName.trim());
        } else {
          const fileId = renameItemId.replace('file-', '');
          await handleRenameFile(fileId, renameItemName.trim());
        }
        setShowRenameModal(false);
        setRenameItemName('');
      } catch (error) {
        // 이미 내부 함수에서 Alert를 띄우므로 여기서 추가하지 않음
      }
    } else {
      Alert.alert('알림', '이름을 입력하세요.');
    }
  };
  
  // 📁 폴더 삭제 함수 수정
  const handleDeleteFolder = async (folderId, name) => {
    if (!currentUserId) {
      Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
      return;
    }
    Alert.alert(
      '폴더 삭제',
      `'${name}' 폴더를 정말 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          onPress: async () => {
            try {
              // 💡 변경: userId를 body에 포함하여 DELETE 요청
              await api.delete(`/studies/${studyId}/folders/${folderId}`, { data: { userId: currentUserId } });
              Alert.alert('삭제 성공', `'${name}' 폴더가 삭제되었습니다.`);
              fetchFoldersAndFiles();
              if (selectedFolderId === folderId) setSelectedFolderId(null);
            } catch (error) {
              console.error('폴더 삭제 실패:', error);
              Alert.alert('삭제 실패', error.response?.data?.message || '알 수 없는 오류');
            }
          },
        },
      ]
    );
  };

  // 📁 폴더 이름 변경 함수 수정
  const handleRenameFolder = async (id, newName) => {
    if (!currentUserId) {
      Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
      return;
    }
    if (!newName || !newName.trim()) {
      Alert.alert('알림', '새 이름을 입력하세요.');
      return;
    }
    try {
      // 💡 변경: userId를 body에 포함하여 PATCH 요청
      await api.patch(`/studies/${studyId}/folders/${id}`, { newName: newName.trim(), userId: currentUserId });
      Alert.alert('이름 변경 성공', '폴더 이름이 변경되었습니다.');
      fetchFoldersAndFiles();
    } catch (error) {
      console.error('폴더 이름 변경 실패:', error);
      Alert.alert('이름 변경 실패', error.response?.data?.message || '알 수 없는 오류');
    }
  };

  const handleLongPressFolder = async (folder) => {
    const isOwner = folder.owner && (folder.owner.toString() === currentUserId);
    const isStudyHost = studyHostId?.toString() === currentUserId;
    
    if (!isOwner && !isStudyHost) {
      Alert.alert('권한 없음', '이 폴더를 삭제하거나 이름을 변경할 권한이 없습니다.');
      return;
    }
    
    Alert.alert(
      '폴더 옵션',
      null,
      [
        {
          text: '삭제',
          onPress: () => {
            if (folder.filesCount > 0) {
              Alert.alert('경고', '폴더 내에 파일이 존재하여 삭제할 수 없습니다.');
            } else {
              handleDeleteFolder(folder._id, folder.name); // 💡 변경: 이름도 함께 전달
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
      ],
    );
  };
 
  // 📄 파일 삭제 함수 수정
  const handleDeleteFile = async (id) => {
    if (!currentUserId) {
      Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
      return;
    }
    Alert.alert(
      '파일 삭제',
      '이 파일을 정말 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          onPress: async () => {
            try {
              // 💡 변경: userId를 body에 포함하여 DELETE 요청
              await api.delete(`/studies/${studyId}/files/${id}`, { data: { userId: currentUserId } });
              Alert.alert('삭제 성공', '파일이 삭제되었습니다.');
              fetchFoldersAndFiles();
            } catch (error) {
              console.error('파일 삭제 실패:', error);
              Alert.alert('삭제 실패', error.response?.data?.message || '알 수 없는 오류');
            }
          },
        },
      ]
    );
  };

  // 📄 파일 이름 변경 함수 수정
  const handleRenameFile = async (id, newName) => {
    if (!currentUserId) {
      Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
      return;
    }
    if (!newName || !newName.trim()) {
      Alert.alert('알림', '새 이름을 입력하세요.');
      return;
    }
    try {
      // 💡 변경: userId를 body에 포함하여 PATCH 요청
      await api.patch(`/studies/${studyId}/files/${id}`, { name: newName.trim(), userId: currentUserId });
      Alert.alert('이름 변경 성공', '파일 이름이 변경되었습니다.');
      fetchFoldersAndFiles();
    } catch (error) {
      console.error('파일 이름 변경 실패:', error);
      Alert.alert('이름 변경 실패', error.response?.data?.message || '알 수 없는 오류');
    }
  };

  const handleLongPressFile = async (file) => {
    const isUploader = file.uploader && (file.uploader.toString() === currentUserId);
    const isStudyHost = studyHostId?.toString() === currentUserId;

    if (!isUploader && !isStudyHost) {
      Alert.alert('알림', '권한이 없습니다.');
      return;
    }

    Alert.alert(
      '파일 옵션',
      null,
      [
        { text: '삭제', onPress: () => handleDeleteFile(file._id) },
        {
          text: '이름 변경',
          onPress: () => {
            if (Platform.OS === 'ios') {
                Alert.prompt('파일 이름 변경', '새로운 이름을 입력하세요.', [
                    { text: '취소', style: 'cancel' },
                    { text: '확인', onPress: newName => handleRenameFile(file._id, newName) },
                ]);
            } else {
              setRenameItemId(`file-${file._id}`);
              setRenameItemName(file.title);
              setShowRenameModal(true);
            }
          },
        },
        { text: '취소', style: 'cancel' },
      ]
    );
  };
  
  const handleUpload = async () => {
    if (!currentUserId) {
      Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled || !result.assets || result.assets.length === 0) {
        Alert.alert('업로드 취소됨');
        return;
      }
      const file = result.assets[0];
      const { uri, name, mimeType } = file;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert('파일 오류', '파일이 존재하지 않습니다.');
        return;
      }
      const formData = new FormData();
      formData.append('title', name);
      formData.append('file', { uri, name, type: mimeType || 'application/octet-stream' });
      if (selectedFolderId) {
        formData.append('folderId', selectedFolderId);
      }
      // 💡 추가: 업로드 시 uploader(userId)를 함께 전송
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>자료 공유</Text>
      <TextInput
        style={styles.search}
        placeholder="검색"
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <View style={styles.folderContainer}>
        {folders.map((folder) => (
          <TouchableOpacity
            key={folder._id} // 💡 변경: key를 _id로 변경
            style={[
              styles.folder,
              selectedFolderId === folder._id && styles.folderSelected
            ]}
            onPress={() => setSelectedFolderId(folder._id)}
            onLongPress={() => handleLongPressFolder(folder)}
          >
            <Icon name="folder" size={40} color={selectedFolderId === folder._id ? '#4A90E2' : '#333'} />
            <Text numberOfLines={1} style={styles.folderName}>{folder.name || ''}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.divider} />

      <FlatList
        data={filteredFiles}
        keyExtractor={(item) => item._id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.fileItem}
            onPress={() => {
              if (!item.filepath) {
                Alert.alert('오류', '파일 경로가 없습니다.');
                return;
              }
              const fileUrl = `${api.defaults.baseURL}/${item.filepath.replace(/\\/g, '/')}`;
              Linking.openURL(fileUrl).catch(() => {
                Alert.alert('오류', '파일을 열 수 없습니다.');
              });
            }}
            onLongPress={() => handleLongPressFile(item)}
          >
            <Icon name="insert-drive-file" size={36} color="#333" />
            <Text numberOfLines={1} style={styles.fileName}>{item.title || '이름 없음'}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.fileList}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>파일이 없습니다</Text></View>}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowFolderModal(true)}>
          <Icon name="create-new-folder" size={24} color="#4A90E2" />
          <Text style={styles.actionButtonText}>새 폴더</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleUpload}>
          <Icon name="cloud-upload" size={24} color="#4A90E2" />
          <Text style={styles.actionButtonText}>파일 업로드</Text>
        </TouchableOpacity>
      </View>

      {/* 새 폴더 추가 모달 */}
      <Modal visible={showFolderModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 폴더 이름</Text>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="폴더 이름"
              style={styles.modalInput}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity onPress={() => setShowFolderModal(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAddFolder} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 이름 변경 모달 (Android용) */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>이름 변경</Text>
            <TextInput
              value={renameItemName}
              onChangeText={setRenameItemName}
              placeholder="새로운 이름"
              style={styles.modalInput}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity onPress={() => setShowRenameModal(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRenameSubmit} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FileShare;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FAFAFA' },
  header: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  search: {
    backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 12, borderColor: '#E0E0E0', borderWidth: 1,
  },
  folderContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' },
  folder: { alignItems: 'center', marginRight: 16, marginBottom: 12, width: width * 0.18 },
  folderSelected: { backgroundColor: '#E1F5FE', borderRadius: 8, padding: 4 },
  folderName: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  fileItem: { alignItems: 'center', margin: 12, width: width * 0.26 },
  fileName: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  fileList: { paddingBottom: 80 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#999' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 16,
  },
  modalButtonText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  }
});