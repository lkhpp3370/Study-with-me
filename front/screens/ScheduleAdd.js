// screens/ScheduleAdd.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert, Switch,
} from 'react-native';
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

  // 입력 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [startObj, setStartObj] = useState(() => { const x = new Date(); x.setMinutes(0, 0, 0); return x; });
  const [endObj, setEndObj] = useState(() => { const x = new Date(); x.setHours(x.getHours() + 1, 0, 0, 0); return x; });
  const [location, setLocation] = useState('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [capacity, setCapacity] = useState(''); // ✅ 최대 인원

  // 피커 상태
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
        startDate: date,     // 통일된 포맷
        startTime,
        endTime,
        repeatWeekly,
        location,
        userId,
        capacity: capacity ? Number(capacity) : undefined, // ✅ 추가
      };

      await api.post('/schedule', payload);
      Alert.alert('성공', '일정이 저장되었습니다.');
      navigation.goBack();
    } catch (err) {
      console.error('일정 저장 실패:', err?.response?.data || err.message);
      Alert.alert('오류', err?.response?.data?.message || '일정을 저장하는데 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일정 추가</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 제목 */}
      <TextInput
        style={styles.input}
        placeholder="일정 제목"
        value={title}
        onChangeText={setTitle}
      />

      {/* 설명 */}
      <TextInput
        style={[styles.input, { height: 90 }]}
        placeholder="설명 (선택)"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* 날짜 */}
      <Text style={styles.label}>날짜</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
        <Text style={styles.dateText}>{toYMD(dateObj)}</Text>
      </TouchableOpacity>

      {/* 시간 */}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>시작 시간</Text>
          <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
            <Text style={styles.dateText}>{toHHmm(startObj)}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>종료 시간</Text>
          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
            <Text style={styles.dateText}>{toHHmm(endObj)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 장소 */}
      <Text style={styles.label}>장소</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 강남 스터디룸"
        value={location}
        onChangeText={setLocation}
      />

      {/* 최대 인원 */}
      <Text style={styles.label}>최대 인원 (선택)</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 10"
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="numeric"
      />

      {/* 반복 */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>매주 반복</Text>
        <Switch value={repeatWeekly} onValueChange={setRepeatWeekly} />
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>저장</Text>
      </TouchableOpacity>

      {/* Date/Time Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
        date={dateObj}
        onConfirm={(d) => { setShowDatePicker(false); if (d) setDateObj(d); }}
        onCancel={() => setShowDatePicker(false)}
      />
      <DateTimePickerModal
        isVisible={showStartPicker}
        mode="time"
        display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
        date={startObj}
        onConfirm={(d) => { setShowStartPicker(false); if (d) setStartObj(d); }}
        onCancel={() => setShowStartPicker(false)}
      />
      <DateTimePickerModal
        isVisible={showEndPicker}
        mode="time"
        display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
        date={endObj}
        onConfirm={(d) => { setShowEndPicker(false); if (d) setEndObj(d); }}
        onCancel={() => setShowEndPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backArrow: { fontSize: 24, color: '#003366' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#003366' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginVertical: 10, fontSize: 16, backgroundColor: '#fff' },
  label: { fontSize: 14, color: '#333', marginTop: 6, marginBottom: 6 },
  dateButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: '#fff', alignItems: 'center' },
  dateText: { fontSize: 16, color: '#333' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  saveButton: { backgroundColor: '#003366', padding: 15, alignItems: 'center', marginTop: 24, borderRadius: 8 },
  saveText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
