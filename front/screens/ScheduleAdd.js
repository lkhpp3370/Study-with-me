import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import api from '../services/api';

export default function ScheduleAdd({ navigation }) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [location, setLocation] = useState('');
  const [repeat, setRepeat] = useState('없음');

  const handleSave = async () => {
    try {
      await api.post('/schedule', {
        title,
        startTime: startDate,
        endTime: endDate,
        location,
        repeat
      });
      Alert.alert('성공', '일정이 저장되었습니다.');
      navigation.goBack();
    } catch (err) {
      console.error('일정 저장 실패:', err);
      Alert.alert('오류', err.response?.data?.message || '일정을 저장하는데 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="일정 제목" value={title} onChangeText={setTitle} />

      <View style={styles.row}>
        <Text style={styles.label}>시작</Text>
        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
          <Text style={styles.dateText}>
            {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>종료</Text>
        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
          <Text style={styles.dateText}>
            {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="장소" value={location} onChangeText={setLocation} />

      <View style={styles.repeatRow}>
        {['없음', '매일', '매주', '매월'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.repeatButton, repeat === option && styles.repeatButtonSelected]}
            onPress={() => setRepeat(option)}
          >
            <Text style={repeat === option && styles.repeatTextSelected}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>저장</Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={showStartPicker}
        mode="datetime"
        display={Platform.OS === 'ios' ? 'default' : 'spinner'}
        date={startDate}
        onConfirm={(date) => { setShowStartPicker(false); setStartDate(date); }}
        onCancel={() => setShowStartPicker(false)}
      />
      <DateTimePickerModal
        isVisible={showEndPicker}
        mode="datetime"
        display={Platform.OS === 'ios' ? 'default' : 'spinner'}
        date={endDate}
        onConfirm={(date) => { setShowEndPicker(false); setEndDate(date); }}
        onCancel={() => setShowEndPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { height: 50, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: '#003366' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginVertical: 10, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12, paddingHorizontal: 10 },
  label: { fontSize: 16, color: '#333', marginRight: 10 },
  dateButton: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: '#fff', alignItems: 'center' },
  dateText: { fontSize: 16, color: '#333' },
  repeatRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  repeatButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, minWidth: 60, alignItems: 'center' },
  repeatButtonSelected: { backgroundColor: '#003366' },
  repeatTextSelected: { color: 'white' },
  saveButton: { backgroundColor: '#003366', padding: 15, alignItems: 'center', marginTop: 20, borderRadius: 8 },
  saveText: { color: 'white', fontSize: 16 },
});
