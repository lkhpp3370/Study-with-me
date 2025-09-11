import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Alert, Dimensions, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import api from '../services/api';

const { width } = Dimensions.get('window');

const FileShare = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fetchFoldersAndFiles = useCallback(async () => {
    try {
      const foldersResponse = await api.get('/folder');
      const uncategorizedFolder = { id: 'no-folder', name: '기타' };
      setFolders([uncategorizedFolder, ...foldersResponse.data]);

      let filesUrl = '/material/files';
      if (selectedFolderId) {
        filesUrl += `?folderId=${selectedFolderId}`;
      }

      const filesResponse = await api.get(filesUrl);
      setFiles(filesResponse.data);
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
      Alert.alert('오류', error.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    }
  }, [selectedFolderId]);

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
        await api.post('/folder', { name: newFolderName.trim() });
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

  const handleDeleteFolder = async (id, name) => {
    try {
      await api.delete(`/folder/${id}`);
      Alert.alert('삭제 성공', `'${name}' 폴더가 삭제되었습니다.`);
      fetchFoldersAndFiles();
      if (selectedFolderId === id) setSelectedFolderId(null);
    } catch (error) {
      console.error('폴더 삭제 실패:', error);
      Alert.alert('삭제 실패', error.response?.data?.message || '알 수 없는 오류');
    }
  };

  const handleRenameFolder = async (id, newName) => {
    try {
      await api.patch(`/folder/${id}`, { newName });
      Alert.alert('이름 변경 성공', '폴더 이름이 변경되었습니다.');
      fetchFoldersAndFiles();
    } catch (error) {
      console.error('폴더 이름 변경 실패:', error);
      Alert.alert('이름 변경 실패', error.response?.data?.message || '알 수 없는 오류');
    }
  };

  const handleDeleteFile = async (id) => {
    try {
      await api.delete(`/material/files/${id}`);
      Alert.alert('삭제 성공', '파일이 삭제되었습니다.');
      fetchFoldersAndFiles();
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      Alert.alert('삭제 실패', error.response?.data?.message || '알 수 없는 오류');
    }
  };

  const handleRenameFile = async (id, newName) => {
    try {
      await api.patch(`/material/files/${id}`, { name: newName });
      Alert.alert('이름 변경 성공', '파일 이름이 변경되었습니다.');
      fetchFoldersAndFiles();
    } catch (error) {
      console.error('파일 이름 변경 실패:', error);
      Alert.alert('이름 변경 실패', error.response?.data?.message || '알 수 없는 오류');
    }
  };

  const handleUpload = async () => {
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

      if (selectedFolderId && selectedFolderId !== 'no-folder') {
        formData.append('folderId', selectedFolderId);
      }

      await api.post('/material', formData, {
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
            key={folder.id}
            style={[
              styles.folder,
              selectedFolderId === folder.id && styles.folderSelected
            ]}
            onPress={() => setSelectedFolderId(folder.id)}
            onLongPress={() => {
              if (folder.id !== 'no-folder') {
                Alert.alert('폴더 옵션', folder.name, [
                  { text: '삭제', onPress: () => handleDeleteFolder(folder.id, folder.name) },
                  { text: '이름 변경', onPress: () => handleRenameFolder(folder.id, folder.name) },
                  { text: '취소', style: 'cancel' },
                ]);
              }
            }}
          >
            <Icon name="folder" size={40} color={selectedFolderId === folder.id ? '#4A90E2' : '#333'} />
            <Text style={styles.folderName}>{folder.name || ''}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredFiles}
        keyExtractor={(item, index) => item._id || `file-${index}`}
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
            onLongPress={() => handleDeleteFile(item._id)}
          >
            <Icon name="insert-drive-file" size={36} color="#333" />
            <Text numberOfLines={1} style={styles.fileName}>{item.title || '이름 없음'}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.fileList}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>파일이 없습니다</Text></View>}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setShowFolderModal(true)}>
        <Icon name="add" size={36} color="#4A90E2" />
        <Text style={styles.addButtonText}>새 폴더 추가</Text>
      </TouchableOpacity>

      {/* 폴더 추가 모달 */}
      <Modal visible={showFolderModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, width: '80%' }}>
            <Text style={{ fontSize: 16, marginBottom: 12 }}>새 폴더 이름을 입력하세요</Text>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="폴더 이름"
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 16 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setShowFolderModal(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: '#888' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAddFolder}>
                <Text style={{ color: '#0d2b40', fontWeight: 'bold' }}>확인</Text>
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
  addButton: { alignItems: 'center', marginVertical: 16 },
  addButtonText: { color: '#4A90E2', fontSize: 14, marginTop: 4 },
});
