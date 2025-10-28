import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, SafeAreaView, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Board = ({ navigation, route }) => {
  const { studyId, studyName, studyHostId } = route.params || {};
  
  if (!studyId) {
    Alert.alert('오류', '스터디 정보를 불러올 수 없습니다. 다시 시도해 주세요.');
    navigation.goBack();
    return null;
  }
  
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

  const handleDeletePost = async (postId, postAuthorId) => {
    const currentUserId = await AsyncStorage.getItem('userId');
    if (!currentUserId) {
      Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
      return;
    }

    const isAuthor = postAuthorId === currentUserId;
    const isStudyHost = studyHostId === currentUserId;

    if (!isAuthor && !isStudyHost) {
      Alert.alert('권한 없음', '게시글을 삭제할 권한이 없습니다.');
      return;
    }
    
    Alert.alert(
      "삭제 확인",
      "정말 이 게시글을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/posts/${postId}`, { data: { userId: currentUserId } });
              Alert.alert('성공', '게시글이 삭제되었습니다.');
              fetchPosts(); 
            } catch (error) {
              console.error('게시글 삭제 실패:', error);
              Alert.alert('오류', error.response?.data?.message || '삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item, index }) => {
    const postAuthorId = item.author?._id || item.author;
    const categoryIcon = 
      selectedCategory === 'NOTICE' ? 'megaphone' :
      selectedCategory === 'QNA' ? 'help-circle' : 'chatbubble-ellipses';

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigation.navigate('BoardDetail', {
          postId: item._id,
          studyId: studyId,
          studyName: studyName,
          studyHostId: studyHostId
        })}
        onLongPress={() => handleDeletePost(item._id, postAuthorId)}
        activeOpacity={0.7}
      >
        <View style={styles.postHeader}>
          <View style={styles.postNumber}>
            <Text style={styles.postNumberText}>{posts.length - index}</Text>
          </View>
          <View style={styles.postInfo}>
            <Text style={styles.postTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.postMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="person" size={12} color="#999" />
                <Text style={styles.metaText}>{item.author?.username || '익명'}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Ionicons name="time" size={12} color="#999" />
                <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color="#D5D9FF" />
      <Text style={styles.emptyText}>
        {searchKeyword ? '검색 결과가 없습니다' : '작성된 게시글이 없습니다'}
      </Text>
      <Text style={styles.emptySubText}>
        {!searchKeyword && '첫 번째 게시글을 작성해보세요'}
      </Text>
    </View>
  );

  const categories = [
    { key: 'NOTICE', label: '공지', icon: 'megaphone' },
    { key: 'QNA', label: 'Q&A', icon: 'help-circle' },
    { key: 'FREE', label: '자유', icon: 'chatbubble-ellipses' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{studyName}</Text>
          <Text style={styles.headerSubtitle}>게시판</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabsContainer}>
        {categories.map(tab => (
          <TouchableOpacity 
            key={tab.key} 
            onPress={() => handleCategoryChange(tab.key)}
            style={[
              styles.tab,
              selectedCategory === tab.key && styles.activeTab
            ]}
          >
            <Ionicons 
              name={tab.icon} 
              size={18} 
              color={selectedCategory === tab.key ? '#4C63D2' : '#999'} 
              style={{ marginRight: 6 }}
            />
            <Text style={[
              styles.tabText,
              selectedCategory === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="게시글 검색"
            placeholderTextColor="#999"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearch}
          />
          {searchKeyword.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchKeyword('');
              fetchPosts(selectedCategory);
            }}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => navigation.navigate('BoardWrite', {
            studyId,
            studyName,
            category: selectedCategory
          })}
        >
          <Ionicons name="create" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={() => fetchPosts()}
            tintColor="#4C63D2"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4C63D2',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
  },
  activeTab: {
    backgroundColor: '#E8EAFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#4C63D2',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8EAFF',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#333',
  },
  writeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4C63D2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 3,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8EAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4C63D2',
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
  },
});

export default Board;