import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ScrollView, Keyboard, 
  Alert, ActivityIndicator 
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>{studyName || 'Study'}</Text>
          <TouchableOpacity onPress={handleBack}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.container}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>제목 *</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="제목을 입력하세요"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

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

          <View style={styles.contentContainer}>
            <Text style={styles.label}>내용 *</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="내용을 입력하세요"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={5000}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>{content.length}/5000</Text>
          </View>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  headerContainer: {
    backgroundColor: '#0d2b40',
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  container: { flex: 1, padding: 16 },
  inputContainer: { marginVertical: 10 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  charCount: { textAlign: 'right', fontSize: 12, color: '#666', marginTop: 4 },
  categoryContainer: { marginVertical: 10 },
  categoryTabs: { flexDirection: 'row', marginTop: 4, gap: 8 },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeCategoryTab: { backgroundColor: '#0d2b40', borderColor: '#0d2b40' },
  categoryText: { color: '#666', fontSize: 14, fontWeight: '500' },
  activeCategoryText: { color: '#fff' },
  contentContainer: { marginVertical: 10, flex: 1 },
  contentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 200,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#0d2b40',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonDisabled: { backgroundColor: '#999' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center' },
});

export default BoardWrite;
