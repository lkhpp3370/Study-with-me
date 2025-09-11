import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Dimensions, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';

const Board = ({ navigation, route }) => {
  const { studyId, studyName } = route.params;
  const [selectedCategory, setSelectedCategory] = useState('QNA');
  const [posts, setPosts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPosts = async (category = selectedCategory, keyword = '') => {
    try {
      setLoading(true);
      let url = '';

      if (keyword.trim()) {
        url = `/api/posts/study/${studyId}/search?keyword=${encodeURIComponent(keyword)}`;
      } else {
        url = `/api/posts/study/${studyId}?category=${category}`;
      }

      const response = await api.get(url, { withCredentials: true });
      setPosts(response.data);
    } catch (error) {
      console.error('게시글 조회 실패:', error);
      Alert.alert('오류', error.response?.data?.message || '게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSearchKeyword('');
  };

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      fetchPosts(selectedCategory, searchKeyword);
    } else {
      fetchPosts(selectedCategory);
    }
  };

  const handleDeletePost = async (postId) => {
    Alert.alert(
      '게시글 삭제',
      '정말로 이 게시글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/posts/${postId}`, { withCredentials: true });
              Alert.alert('성공', '게시글이 삭제되었습니다.');
              fetchPosts();
            } catch (error) {
              console.error('삭제 오류:', error);
              Alert.alert('오류', error.response?.data?.message || '삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item, index }) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <TouchableOpacity
        style={styles.tableRow}
        onPress={() => navigation.navigate('BoardDetail', {
          postId: item._id,
          studyId,
          studyName
        })}
        onLongPress={() => handleDeletePost(item._id)}
      >
        <Text style={styles.tableCell}>{posts.length - index}</Text>
        <Text style={[styles.tableCell, styles.titleCell]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.tableCell}>{formatDate(item.createdAt)}</Text>
        <Text style={styles.tableCell}>{item.author?.username || '익명'}</Text>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchKeyword ? '검색 결과가 없습니다' : '현재 작성된 게시글이 없습니다'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.studyNameContainer}>
          <Text style={styles.studyName}>{studyName || 'Study'}</Text>
        </View>

        <View style={styles.boardContainer}>
          <Text style={styles.boardTitle}>게시판</Text>

          <View style={styles.tabsContainer}>
            {[
              { key: 'NOTICE', label: '공지' },
              { key: 'QNA', label: 'Q&A' },
              { key: 'FREE', label: '자유' }
            ].map(tab => (
              <TouchableOpacity key={tab.key} onPress={() => handleCategoryChange(tab.key)} style={{ flex: 1 }}>
                <Text style={[styles.tab, selectedCategory === tab.key && styles.activeTab]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>NO</Text>
            <Text style={styles.tableHeaderText}>제목</Text>
            <Text style={styles.tableHeaderText}>작성시간</Text>
            <Text style={styles.tableHeaderText}>작성자</Text>
          </View>

          <FlatList
            data={posts}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            keyExtractor={(item) => item._id}
            refreshing={loading}
            onRefresh={() => fetchPosts()}
            style={styles.flatList}
          />

          <View style={styles.searchWriteContainer}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="검색어를 입력하세요"
                placeholderTextColor="#888"
                value={searchKeyword}
                onChangeText={setSearchKeyword}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity onPress={handleSearch}>
                <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.writeButton}
              onPress={() => navigation.navigate('BoardWrite', {
                studyId,
                studyName,
                category: selectedCategory
              })}
            >
              <Text style={styles.writeButtonText}>글쓰기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1 },
  studyNameContainer: {
    backgroundColor: '#0d2b40',
    paddingVertical: 20,
    alignItems: 'center',
  },
  studyName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  boardContainer: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 16,
    padding: 10,
    flex: 1,
  },
  boardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
  },
  tab: { fontSize: 16, color: '#888', textAlign: 'center' },
  activeTab: { fontWeight: 'bold', color: '#000' },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 10,
  },
  tableHeaderText: { fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  flatList: { flex: 1 },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 10,
  },
  tableCell: { flex: 1, textAlign: 'center', fontSize: 12 },
  titleCell: { textAlign: 'left', paddingHorizontal: 5 },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 16 },
  searchWriteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginHorizontal: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    flex: 1,
    marginRight: 10,
  },
  searchInput: { flex: 1, height: 40, color: '#000' },
  searchIcon: { marginLeft: 5 },
  writeButton: {
    backgroundColor: '#0d2b40',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  writeButtonText: { color: '#fff', fontSize: 14 },
  backButton: {
    backgroundColor: '#0d2b40',
    paddingVertical: 20,
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  backButtonText: { color: '#fff', fontSize: 16 },
});

export default Board;
