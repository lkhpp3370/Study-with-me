import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// 기존 스크린
import LoginScreen from './screens/LoginScreen';
import MainScreen from './screens/MainScreen';
import SearchCategories from './screens/SearchCategories';
import SearchScreen from './screens/SearchScreen';
import ChatScreen from './screens/ChatScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import ProfileScreen from './screens/ProfileScreen';
import SetProfile from './screens/SetProfile';
import SettingScreen from './screens/SettingScreen';
import NotificationScreen from './screens/NotificationScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import CategorySelectScreen from './screens/CategorySelectScreen';
import CreateStudyScreen from './screens/CreateStudyScreen';
import StudyIntroScreen from './screens/StudyIntroScreen';

// ✅ 출석 관련
import AttendanceScreen from './screens/AttendanceScreen';
import MonthlyRankingScreen from './screens/MonthlyRankingScreen';
import UserAttendanceScreen from './screens/UserAttendanceScreen';
import StudyAttendanceScreen from './screens/StudyAttendanceScreen';
import AttendanceCheckScreen from './screens/AttendanceCheckScreen';
import AttendanceDetailScreen from './screens/AttendanceDetailScreen';

// ✅ 김현서 프로젝트에서 가져온 화면
import Studyroommain from './screens/Studyroommain';
import Board from './screens/Board';
import BoardWrite from './screens/BoardWrite';
import FileShare from './screens/fileshare';
import ScheduleAdd from './screens/ScheduleAdd';

// ✅ 검색 결과 화면 (샘플)
function SearchResultsScreen({ route }) {
  const { category, gender, field, subField } = route.params || {};
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>검색 결과 화면</Text>
      <Text>{category} / {gender} / {field} / {subField}</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function PlacesScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>장소추천 화면(준비중)</Text>
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="홈"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === '홈') iconName = 'home';
          else if (route.name === '검색') iconName = 'search';
          else if (route.name === '출석률') iconName = 'calendar';
          else iconName = 'location';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="출석률" component={AttendanceScreen} options={{ headerShown: false }} />
      <Tab.Screen name="검색" component={SearchScreen} options={{ headerShown: false }} />
      <Tab.Screen name="홈" component={MainScreen} options={{ headerShown: false }} />
      <Tab.Screen name="장소추천" component={PlacesScreen} options={{ headerShown: true, title: '장소추천' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* 로그인 / 탭 */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />

        {/* 채팅 */}
        <Stack.Screen name="채팅목록" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChatRoomScreen" component={ChatRoomScreen} options={{ headerShown: true, title: '채팅방' }} />

        {/* 회원/프로필 */}
        <Stack.Screen name="회원가입" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="비밀번호 찾기" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="내 프로필" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="프로필 관리" component={SetProfile} options={{ headerShown: false }} />
        <Stack.Screen name="설정" component={SettingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="알림내역" component={NotificationScreen} options={{ headerShown: false }} />

        {/* 스터디 */}
        <Stack.Screen name="스터디상세" component={Studyroommain} options={{ headerShown: false }} />
        <Stack.Screen name="카테고리선택" component={CategorySelectScreen} options={{ headerShown: true, title: '카테고리 선택' }} />
        <Stack.Screen name="스터디개설" component={CreateStudyScreen} options={{ headerShown: true, title: '스터디 개설' }} />
        <Stack.Screen name="카테고리검색" component={SearchCategories} options={{ headerShown: true, title: '카테고리 검색' }} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ headerShown: true, title: '검색 결과' }} />
        <Stack.Screen name="스터디소개" component={StudyIntroScreen} options={{ headerShown: true, title: '스터디 소개' }} />

        {/* 출석 */}
        <Stack.Screen name="MonthlyRanking" component={MonthlyRankingScreen} options={{ headerShown: true, title: '월간 랭킹' }} />
        <Stack.Screen name="UserAttendance" component={UserAttendanceScreen} options={{ headerShown: true, title: '내 출석 기록' }} />
        <Stack.Screen name="StudyAttendance" component={StudyAttendanceScreen} options={{ headerShown: true, title: '스터디 출석 현황' }} />
        <Stack.Screen name="AttendanceCheck" component={AttendanceCheckScreen} options={{ headerShown: true, title: '출석 체크' }} />
        <Stack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} options={{ headerShown: true, title: '출석 상세' }} />

        {/* ✅ 추가된 화면 */}
        <Stack.Screen name="Board" component={Board} options={{ headerShown: false }} />
        <Stack.Screen name="BoardWrite" component={BoardWrite} options={{ headerShown: false }} />
        <Stack.Screen name="FileShare" component={FileShare} options={{ headerShown: false }} />
        <Stack.Screen name="ScheduleAdd" component={ScheduleAdd} options={{ headerShown: false }} />
        <Stack.Screen name="Studyroommain" component={Studyroommain} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
