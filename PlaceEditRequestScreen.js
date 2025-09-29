// screens/PlaceEditRequestScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, Switch, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '@env';

const TYPES = [
  { label: '카페', value: 'cafe', icon: 'cafe' },
  { label: '스터디카페', value: 'study', icon: 'school' },
  { label: '도서관', value: 'library', icon: 'book' },
  { label: '기타', value: 'etc', icon: 'options' },
];

export default function PlaceEditRequestScreen({ route, navigation }) {
  const { placeId, initial = {} } = route.params || {};
  const [name, setName] = useState(initial.name || '');
  const [address, setAddress] = useState(initial.address || '');
  const [type, setType] = useState(initial.type || 'etc');
  const [seatCount, setSeatCount] = useState(
    typeof initial.seatCount === 'number' ? String(initial.seatCount) : ''
  );
  const [powerOutlet, setPowerOutlet] = useState(!!initial.powerOutlet);
  const [wifi, setWifi] = useState(!!initial.wifi);
  const [groupAvailable, setGroupAvailable] = useState(!!initial.groupAvailable);
  const [price, setPrice] = useState(initial.price || '보통');

  const submit = async () => {
    if (!placeId) {
      Alert.alert('오류', 'placeId가 없습니다.');
      return;
    }
    if (!name.trim() || !address.trim()) {
      Alert.alert('알림', '이름과 주소는 필수입니다.');
      return;
    }
    try {
      await axios.patch(`${BACKEND_URL}/places/${placeId}`, {
        name: name.trim(),
        address: address.trim(),
        type,
        seatCount: Number(seatCount) || 0,
        powerOutlet,
        wifi,
        groupAvailable,
        price,
      });
      Alert.alert('완료', '수정 요청이 전송되었습니다.\n검토 후 반영됩니다.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('실패', '수정 요청 전송에 실패했습니다.');
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: '정보 수정 요청' });
  }, [navigation]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>이름*</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="장소 이름" />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>주소*</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="도로명 주소" />
        </View>

        <Text style={[styles.label, { marginTop: 8 }]}>유형</Text>
        <View style={styles.typeRow}>
          {TYPES.map(t => {
            const on = type === t.value;
            return (
              <TouchableOpacity
                key={t.value}
                onPress={() => setType(t.value)}
                style={[styles.typeChip, on && styles.typeChipOn]}
              >
                <Ionicons name={t.icon} size={14} color={on ? '#fff' : '#6b7280'} />
                <Text style={[styles.typeText, on && { color: '#fff' }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>좌석 수</Text>
          <TextInput
            style={styles.input}
            value={seatCount}
            onChangeText={setSeatCount}
            keyboardType="numeric"
            placeholder="예: 24"
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>콘센트</Text>
          <Switch value={powerOutlet} onValueChange={setPowerOutlet} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Wi-Fi</Text>
          <Switch value={wifi} onValueChange={setWifi} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>그룹 이용</Text>
          <Switch value={groupAvailable} onValueChange={setGroupAvailable} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>가격대</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="무료 / 저렴 / 보통 / 비쌈"
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={submit}>
          <Text style={styles.submitText}>수정 요청 보내기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  row: { marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontWeight: '700', marginBottom: 6, color: '#111' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#cbd5e1' },
  typeChipOn: { backgroundColor: '#1f6feb', borderColor: '#1f6feb' },
  typeText: { color: '#6b7280', fontWeight: '600' },
  submitBtn: { backgroundColor: '#1f6feb', borderRadius: 12, alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700' }
});
