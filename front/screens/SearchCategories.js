import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Button } from 'react-native';

const SearchCategories = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedSubField, setSelectedSubField] = useState(null);

  // Toggle selection logic
  const toggleSelection = (current, setter, value) => {
    setter(current === value ? null : value);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>스터디 종류</Text>
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.button, selectedCategory === '자유' && styles.selectedButton]}
            onPress={() => toggleSelection(selectedCategory, setSelectedCategory, '자유')}
          >
            <Text style={[styles.buttonText, selectedCategory === '자유' && styles.selectedButtonText]}>자유</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, selectedCategory === '정규' && styles.selectedButton]}
            onPress={() => toggleSelection(selectedCategory, setSelectedCategory, '정규')}
          >
            <Text style={[styles.buttonText, selectedCategory === '정규' && styles.selectedButtonText]}>정규</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>성별</Text>
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.button, selectedGender === '남' && styles.selectedButton]}
            onPress={() => toggleSelection(selectedGender, setSelectedGender, '남')}
          >
            <Text style={[styles.buttonText, selectedGender === '남' && styles.selectedButtonText]}>남</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, selectedGender === '여' && styles.selectedButton]}
            onPress={() => toggleSelection(selectedGender, setSelectedGender, '여')}
          >
            <Text style={[styles.buttonText, selectedGender === '여' && styles.selectedButtonText]}>여</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, selectedGender === '무관' && styles.selectedButton]}
            onPress={() => toggleSelection(selectedGender, setSelectedGender, '무관')}
          >
            <Text style={[styles.buttonText, selectedGender === '무관' && styles.selectedButtonText]}>무관</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>스터디 분야</Text>
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.button, selectedField === '취업' && styles.selectedButton]}
            onPress={() => toggleSelection(selectedField, setSelectedField, '취업')}
          >
            <Text style={[styles.buttonText, selectedField === '취업' && styles.selectedButtonText]}>취업</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, selectedField === '자격증' && styles.selectedButton]}
            onPress={() => toggleSelection(selectedField, setSelectedField, '자격증')}
          >
            <Text style={[styles.buttonText, selectedField === '자격증' && styles.selectedButtonText]}>자격증</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, selectedField === '대회' && styles.selectedButton]}
            onPress={() => toggleSelection(selectedField, setSelectedField, '대회')}
          >
            <Text style={[styles.buttonText, selectedField === '대회' && styles.selectedButtonText]}>대회</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>스터디 분야(상세)</Text>
        <View style={styles.row}>
          {['IT', '금융', '디자인', '마케팅'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.button, selectedSubField === item && styles.selectedButton]}
              onPress={() => toggleSelection(selectedSubField, setSelectedSubField, item)}
            >
              <Text style={[styles.buttonText, selectedSubField === item && styles.selectedButtonText]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.submitButton}
        onPress={() => navigation.navigate('SearchResults', {
          category: selectedCategory,
          gender: selectedGender,
          field: selectedField,
          subField: selectedSubField,
        })}
      >
        <Text style={styles.submitButtonText}>검색 결과 보기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    marginTop:35,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
    paddingLeft: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#17A1FA',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedButtonText: {
    color: '#FFFFFF',
  },
  submitButton: {
    margin: 16,
    paddingVertical: 14,
    backgroundColor: '#0A2540',
    borderRadius: 35,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 600,
  },
});

export default SearchCategories;