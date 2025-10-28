// screens/ScheduleAdd.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert, Switch, SafeAreaView, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../services/api';

const pad = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toHHmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function ScheduleAdd() {
  const route = useRoute();
  const navigation = useNavigation();
  const studyId = route.params?.studyId || null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [startObj, setStartObj] = useState(() => { const x = new Date(); x.setMinutes(0, 0, 0); return x; });
  const [endObj, setEndObj] = useState(() => { const x = new Date(); x.setHours(x.getHours() + 1, 0, 0, 0); return x; });
  const [location, setLocation] = useState('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [capacity, setCapacity] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleSave = async () => {
    try {
      if (!title.trim()) return Alert.alert('안내', '일정 제목을 입력해주세요.');

      const date = toYMD(dateObj);
      const startTime = toHHmm(startObj);
      const endTime = toHHmm(endObj);

      const startMin = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5));
      const endMin = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5));
      if (endMin <= startMin) return Alert.alert('안내', '종료 시간은 시작 시간보다 늦어야 합니다.');

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return Alert.alert('오류', '로그인이 필요합니다.');

      const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

      const payload = {
        studyId: studyId || undefined,
        title,
        description,
        dayOfWeek,
        startDate: date,
        startTime,
        endTime,
        repeatWeekly,
        location,
        userId,
        capacity: capacity ? Number(capacity) : undefined,
      };

      await api.post('/schedule', payload);
      Alert.alert('성공', '일정이 저장되었습니다.');
      navigation.goBack();
    } catch (err) {
      console.error('일정 저장 실패:', err?.response?.data || err.message);
      Alert.alert('오류', err?.response?.data?.message || '일정을 저장하는데 실패했습니다.');
    }
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4C63D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일정 추가</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Ionicons name="document-text" size={18} color="#4C63D2" style={{ marginRight: 6 }} />
              <Text style={styles.label}>일정 제목</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="예: 주간 스터디 모임"
              placeholderTextColor="#AAA"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Ionicons name="create" size={18} color="#4C63D2" style={{ marginRight: 6 }} />
              <Text style={styles.label}>설명</Text>
              <Text style={styles.optional}>(선택)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="일정에 대한 설명을 입력하세요"
              placeholderTextColor="#AAA"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Ionicons name="calendar" size={18} color="#4C63D2" style={{ marginRight: 6 }} />
              <Text style={styles.label}>날짜</Text>
            </View>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
              <Text style={styles.dateText}>{formatDateDisplay(dateObj)}</Text>
              <Ionicons name="chevron-down" size={20} color="#4C63D2" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Ionicons name="time" size={18} color="#4C63D2" style={{ marginRight: 6 }} />
              <Text style={styles.label}>시간</Text>
            </View>
            <View style={styles.timeRow}>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>시작</Text>
                <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.timeButton}>
                  <Text style={styles.timeText}>{toHHmm(startObj)}</Text>
                  <Ionicons name="time-outline" size={18} color="#4C63D2" />
                </TouchableOpacity>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#999" style={{ marginHorizontal: 10 }} />
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>종료</Text>
                <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.timeButton}>
                  <Text style={styles.timeText}>{toHHmm(endObj)}</Text>
                  <Ionicons name="time-outline" size={18} color="#4C63D2" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Ionicons name="location" size={18} color="#4C63D2" style={{ marginRight: 6 }} />
              <Text style={styles.label}>장소</Text>
              <Text style={styles.optional}>(선택)</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="예: 강남 스터디룸"
              placeholderTextColor="#AAA"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Ionicons name="people" size={18} color="#4C63D2" style={{ marginRight: 6 }} />
              <Text style={styles.label}>최대 인원</Text>
              <Text style={styles.optional}>(선택, 미입력 시 무제한)</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="예: 10"
              placeholderTextColor="#AAA"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.switchContainer}>
              <View style={styles.switchLeft}>
                <View style={styles.switchIconBox}>
                  <Ionicons name="repeat" size={20} color="#4C63D2" />
                </View>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>매주 반복</Text>
                  <Text style={styles.switchDesc}>같은 요일에 반복 일정 생성</Text>
                </View>
              </View>
              <Switch 
                value={repeatWeekly} 
                onValueChange={setRepeatWeekly}
                trackColor={{ false: '#ccc', true: '#B5BFFF' }}
                thumbColor={repeatWeekly ? '#4C63D2' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveText}>저장</Text>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        date={dateObj}
        onConfirm={(d) => { setShowDatePicker(false); if (d) setDateObj(d); }}
        onCancel={() => setShowDatePicker(false)}
      />
      <DateTimePickerModal
        isVisible={showStartPicker}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        date={startObj}
        onConfirm={(d) => { setShowStartPicker(false); if (d) setStartObj(d); }}
        onCancel={() => setShowStartPicker(false)}
      />
      <DateTimePickerModal
        isVisible={showEndPicker}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        date={endObj}
        onConfirm={(d) => { setShowEndPicker(false); if (d) setEndObj(d); }}
        onCancel={() => setShowEndPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  required: {
    fontSize: 14,
    color: '#FF5B5B',
    marginLeft: 4,
    fontWeight: '600',
  },
  optional: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFBFC',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FAFBFC',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBox: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFBFC',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8EAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4C63D2',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4C63D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});