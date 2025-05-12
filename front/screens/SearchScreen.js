import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const SearchScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TouchableOpacity 
          style={styles.categoryButton} 
          onPress={() => navigation.navigate('SearchCategories')}
        >
          <Ionicons name="options-outline" size={24} color="gray" />
        </TouchableOpacity>
      </View>
      <Text style={styles.placeholderText}>스터디 그룹을 검색해보세요!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 16,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  categoryButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 100,
  },
});

export default SearchScreen;
""