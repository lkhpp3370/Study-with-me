import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ScrollView, Keyboard, 
  Alert, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';

const categories = [
  { key: 'QNA', label: 'Q&A' },
  { key: 'NOTICE', label: '공지' },
  { key: 'FREE', label: '자유' }
];

const BoardWrite = ({ route }) => {
  const navigation = useNavigation();
  const { studyId, studyName, category: initialCategory } = route.params;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'QNA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('오류', '제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('오류', '내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      Keyboard.dismiss();

      const response = await api.post(`/api/posts/study/${studyId}`, {
        title: title.trim(),
        content: content.trim(),
        category: selectedCategory,
      }, { withCredentials: true });

      Alert.alert('성공', '게시글이 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            navigation.navigate('Board', {
              studyId,
              studyName,
              refresh: Date.now()
            });
          }
        }
      ]);
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      if (error.response?.status === 401) {
        Alert.alert('오류', '로그인이 필요합니다. 다시 로그인해주세요.');
      } else {
        Alert.alert('오류', error.response?.data?.message || '게시글 저장에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        '나가기',
        '작성 중인 내용이 있습니다. 정말로 나가시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '나가기', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* 헤더 */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{studyName || 'Study'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* 제목 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>제목 *</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="제목을 입력하세요"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                editable={!isSubmitting}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            {/* 분류 */}
            <View style={styles.categoryContainer}>
              <Text style={styles.label}>분류 *</Text>
              <View style={styles.categoryTabs}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryTab,
                      selectedCategory === cat.key && styles.activeCategoryTab,
                    ]}
                    onPress={() => setSelectedCategory(cat.key)}
                    disabled={isSubmitting}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === cat.key && styles.activeCategoryText,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 내용 */}
            <View style={styles.contentContainer}>
              <Text style={styles.label}>내용 *</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="내용을 입력하세요"
                placeholderTextColor="#999"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                maxLength={5000}
                editable={!isSubmitting}
              />
              <Text style={styles.charCount}>{content.length}/5000</Text>
            </View>
          </View>
        </ScrollView>

        {/* 저장 버튼 - 하단 고정 */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.saveButtonText, { marginLeft: 10 }]}>저장 중...</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>저장</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3949AB', // 인디고 헤더
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#3949AB', // 인디고
  },
  backButton: {
    padding: 4,
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: { 
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: { 
    flex: 1, 
    padding: 20,
  },
  inputContainer: { 
    marginBottom: 24,
  },
  label: { 
    fontSize: 15, 
    fontWeight: '600', 
    marginBottom: 10, 
    color: '#1a1a1a',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  charCount: { 
    textAlign: 'right', 
    fontSize: 12, 
    color: '#7986CB', // 연한 인디고
    marginTop: 6,
  },
  categoryContainer: { 
    marginBottom: 24,
  },
  categoryTabs: { 
    flexDirection: 'row', 
    gap: 10,
  },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#E8EAF6', // 아주 연한 인디고
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C5CAE9', // 연한 인디고 테두리
  },
  activeCategoryTab: { 
    backgroundColor: '#3949AB', // 인디고
    borderColor: '#3949AB',
  },
  categoryText: { 
    color: '#5C6BC0', // 중간 인디고
    fontSize: 14, 
    fontWeight: '500',
  },
  activeCategoryText: { 
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: { 
    flex: 1,
    marginBottom: 24,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 240,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  saveButton: {
    backgroundColor: '#3949AB', // 인디고
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#3949AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: { 
    backgroundColor: '#bbb',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700',
  },
  loadingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
});

export default BoardWrite;