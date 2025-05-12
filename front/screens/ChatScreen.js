import React from 'react';
import { StyleSheet,View, Text } from 'react-native';

export default function ChatScreen() {
  return (
    <View>
      <Text style={styles.chatText}>채팅 화면입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  
  chatText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 420,
    marginLeft: 125,
  },

});

