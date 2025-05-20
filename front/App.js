import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './screens/LoginScreen';
import MainScreen from './screens/MainScreen';
import SearchCategories from './screens/SearchCategories';
import SearchScreen from './screens/SearchScreen';
import ChatScreen from './screens/ChatScreen';
import ChatRoomScreen from './screens/ChatRoomScreen'; // ✅ 추가
import ProfileScreen from './screens/ProfileScreen';
import SetProfile from './screens/SetProfile';
import SettingScreen from './screens/SettingScreen';
import NotificationScreen from './screens/NotificationScreen';
import StudyDetailScreen from './screens/StudyDetailScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="홈"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName =
            route.name === '홈'
              ? 'home'
              : route.name === '검색'
              ? 'search'
              : 'location-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="검색"
        component={SearchCategories}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="홈"
        component={MainScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="장소 추천"
        component={MainScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="회원가입"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="비밀번호 찾기"
          component={ForgotPasswordScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="카테고리 검색"
          component={SearchCategories}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="채팅"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatRoomScreen"
          component={ChatRoomScreen}
          options={{ headerShown: true, title: '채팅방' }} // ✅ 채팅방 스크린 등록
        />
        <Stack.Screen
          name="내 프로필"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="프로필 관리"
          component={SetProfile}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="설정"
          component={SettingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="알림내역"
          component={NotificationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="스터디상세"
          component={StudyDetailScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
