// screens/PlaceEditRequestScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '../services/api';

export default function PlaceEditRequestScreen({ route, navigation }) {
  const { placeId, place: placeFromParams } = route.params;

  const [form, setForm] = useState({
    name: '',
    address: '',
    type: 'cafe',
    phone: '',
    website: '',
    openingHours: '',
    open_24h: false,
    seatCount: 0,
    powerOutlet: false,
    wifi: false,
    groupAvailable: false,
  });

  // ✅ placeId로 DB에서 정보 불러오기
  useEffect(() => {
    const loadPlace = async () => {
      try {
        if (placeFromParams) {
          setForm(prev => ({ ...prev, ...placeFromParams }));
        } else {
          const res = await axios.get(`${BACKEND_URL}/places/${placeId}`);
          setForm(prev => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error('❌ 장소 정보 불러오기 실패:', err.message);
      }
    };
    loadPlace();
  }, [placeId]);
  
  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const submitEditRequest = async () => {
    try {
      await axios.post(`${BACKEND_URL}/places/request-edit/${placeId}`, form, {
        headers: { 'Content-Type': 'application/json' },
      });

      Alert.alert(
        '성공',
        '수정 요청이 접수되었습니다.',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(), // ✅ Alert 확인 시 뒤로가기
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      console.error('❌ 수정 요청 오류:', err.message);
      Alert.alert('실패', '수정 요청에 실패했습니다.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>이름</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={text => handleChange('name', text)}
      />

      <Text style={styles.label}>주소</Text>
      <TextInput
        style={styles.input}
        value={form.address}
        onChangeText={text => handleChange('address', text)}
      />

      <Text style={styles.label}>유형</Text>
      <View style={styles.typeRow}>
        {['cafe', 'study', 'library', 'other'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
            onPress={() => handleChange('type', t)}
          >
            <Text
              style={[
                styles.typeBtnText,
                form.type === t && styles.typeBtnTextActive,
              ]}
            >
              {t === 'cafe'
                ? '카페'
                : t === 'study'
                ? '스터디카페'
                : t === 'library'
                ? '도서관'
                : '기타'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>전화번호</Text>
      <TextInput
        style={styles.input}
        value={form.phone}
        onChangeText={text => handleChange('phone', text)}
      />

      <Text style={styles.label}>웹사이트</Text>
      <TextInput
        style={styles.input}
        value={form.website}
        onChangeText={text => handleChange('website', text)}
      />

      <Text style={styles.label}>영업시간</Text>
      <TextInput
        style={styles.input}
        value={form.openingHours}
        onChangeText={text => handleChange('openingHours', text)}
      />

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.checkBtn, form.open_24h && styles.checkBtnActive]}
          onPress={() => handleChange('open_24h', !form.open_24h)}
        >
          <Ionicons
            name={form.open_24h ? 'checkbox' : 'square-outline'}
            size={20}
            color={form.open_24h ? '#fff' : '#555'}
          />
          <Text
            style={[styles.checkBtnText, form.open_24h && styles.checkBtnTextActive]}
          >
            24시간 운영
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>좌석 수</Text>
      <TextInput
        style={styles.input}
        value={String(form.seatCount)}
        keyboardType="numeric"
        onChangeText={text => handleChange('seatCount', parseInt(text) || 0)}
      />

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.checkBtn, form.powerOutlet && styles.checkBtnActive]}
          onPress={() => handleChange('powerOutlet', !form.powerOutlet)}
        >
          <Ionicons
            name={form.powerOutlet ? 'checkbox' : 'square-outline'}
            size={20}
            color={form.powerOutlet ? '#fff' : '#555'}
          />
          <Text
            style={[styles.checkBtnText, form.powerOutlet && styles.checkBtnTextActive]}
          >
            콘센트
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.checkBtn, form.wifi && styles.checkBtnActive]}
          onPress={() => handleChange('wifi', !form.wifi)}
        >
          <Ionicons
            name={form.wifi ? 'checkbox' : 'square-outline'}
            size={20}
            color={form.wifi ? '#fff' : '#555'}
          />
          <Text
            style={[styles.checkBtnText, form.wifi && styles.checkBtnTextActive]}
          >
            Wi-Fi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.checkBtn, form.groupAvailable && styles.checkBtnActive]}
          onPress={() => handleChange('groupAvailable', !form.groupAvailable)}
        >
          <Ionicons
            name={form.groupAvailable ? 'checkbox' : 'square-outline'}
            size={20}
            color={form.groupAvailable ? '#fff' : '#555'}
          />
          <Text
            style={[
              styles.checkBtnText,
              form.groupAvailable && styles.checkBtnTextActive,
            ]}
          >
            그룹 이용
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={submitEditRequest}>
        <Text style={styles.submitBtnText}>수정 요청 제출</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  typeRow: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  typeBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  typeBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  typeBtnText: { fontSize: 14, color: '#555' },
  typeBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  checkBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkBtnText: { marginLeft: 6, fontSize: 14, color: '#555' },
  checkBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  submitBtn: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

