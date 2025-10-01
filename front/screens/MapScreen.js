// screens/MapScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Platform, Modal, Pressable, Alert, Linking, FlatList, Animated, PanResponder, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '@env';
import * as Location from 'expo-location'; // ✅ 수정: 정적 import 사용
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { KAKAO_JS_KEY } from '@env';

// 초기 중심: 부경대(대연캠퍼스 인근)
const DEFAULT_CENTER = { latitude: 35.1335, longitude: 129.105 };

// ✅ 스냅포인트: 완전 내림(0) / 기본(0.35) / 최대로 올림(0.8)
const SNAP_POINTS = [0.0, 0.35, 0.8];
const MAX_SHEET_PCT = 0.8; // 화면 최대 80%
const WIN_H = Dimensions.get('window').height;

export default function MapScreen({ route, navigation }) {
  const webRef = useRef(null);
  const [userId, setUserId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchPlaces();   // 장소 목록 + 평균 평점 다시 불러오기
    }, [])
  );

  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('userId');
      if (id) setUserId(id);
    })();
  }, []);

  // 지도/필터 상태
  const [region, setRegion] = useState(DEFAULT_CENTER);
  const [myLocation, setMyLocation] = useState(null);
  const [query, setQuery] = useState('');
  const [onlyOutlets, setOnlyOutlets] = useState(false);
  const [only24h, setOnly24h] = useState(false);
  const [typeCafe, setTypeCafe] = useState(true);
  const [typeStudy, setTypeStudy] = useState(true);
  const [typeLibrary, setTypeLibrary] = useState(true);
  const [typeOther, setTypeOther] = useState(true);
  const [onlyGroup, setOnlyGroup] = useState(false);
  const [onlyWifi, setOnlyWifi] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const boundsTimeout = useRef(null);

  const [places, setPlaces] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [visiblePlaces, setVisiblePlaces] = useState([]);

  const [showFilter, setShowFilter] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);

  const [ratingMap, setRatingMap] = useState({});

  const [sheetHeight] = useState(new Animated.Value(0));
  const sheetRatioRef = useRef(SNAP_POINTS[1]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const delta = -g.dy / (WIN_H * MAX_SHEET_PCT);
        let next = Math.max(0, Math.min(1, sheetRatioRef.current + delta));
        sheetHeight.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const v = g.vy;
        sheetRatioRef.current = snapTo(sheetHeight, v);
      },
    })
  ).current;

  const fetchPlaces = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/places`);
      const places = res.data;

      // 각 장소별 avg 가져오기
      const withAvg = await Promise.all(
        places.map(async (p) => {
          try {
            const avgRes = await axios.get(`${BACKEND_URL}/reviews/place/${p._id}/avg`);
            return { ...p, avg: avgRes.data.avg, reviewCount: avgRes.data.count };
          } catch {
            return { ...p, avg: 0, reviewCount: 0 };
          }
        })
      );

      setPlaces(withAvg);
    } catch (err) {
      console.error('장소 불러오기 실패:', err.message);
    }
  };

  const fetchFavorites = async (uid = userId) => {
    try {
      if (!uid) return; // userId 없으면 호출 안 함
      const res = await axios.get(`${BACKEND_URL}/favorites`, { params: { userId: uid } });
      const arr = Array.isArray(res.data) ? res.data : [];
      setFavorites(new Set(arr.map(it => (it.place?._id || it.place))));
    } catch (e) {
      console.log('getFavorites fail', e?.response?.data || e.message);
    }
  };


  useEffect(() => {
    fetchPlaces();
    Animated.timing(sheetHeight, { toValue: SNAP_POINTS[1], duration: 0, useNativeDriver: false }).start();
    sheetRatioRef.current = SNAP_POINTS[1];
  }, []);

  useEffect(() => {
    if (userId) fetchFavorites();
  }, [userId]);

  useEffect(() => {
  if (webRef.current && filteredPlaces) {
    webRef.current.injectJavaScript(`
      window.updatePlaces(${JSON.stringify(filteredPlaces)});
      true;
    `);
  }
}, [filteredPlaces]);

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (places || [])
      .filter(p => (q ? (p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)) : true))
      .filter(p => {
        const t = p.type || 'other';
        return (
          (typeCafe && t === 'cafe') ||
          (typeStudy && t === 'study') ||
          (typeLibrary && t === 'library') ||
          (typeOther && t === 'other')
        );
      })
      .filter(p => (onlyOutlets ? p.powerOutlet : true))
      .filter(p => (only24h ? p.open_24h : true))
      .filter(p => (onlyGroup ? p.groupAvailable : true))
      .filter(p => (onlyWifi ? p.wifi : true))
      .filter(p => (onlyFav ? favorites.has(p._id) : true));
  }, [places, query, typeCafe, typeStudy, typeLibrary, typeOther, onlyOutlets, only24h, onlyGroup, onlyWifi, onlyFav, favorites]);

  const listData = useMemo(() => {
    if (onlyFav) {
      // 즐겨찾기 + 필터 적용
      return filteredPlaces.filter(p => favorites.has(p._id));
    }
    // 기본: 현재 화면에 보이는 장소 중 필터된 것만
    return visiblePlaces.filter(p => filteredPlaces.some(f => f._id === p._id));
  }, [onlyFav, filteredPlaces, favorites, visiblePlaces]);

  const html = useMemo(() => buildKakaoHtml(KAKAO_JS_KEY, DEFAULT_CENTER, [], null), []);

  useEffect(() => {
    if (webRef.current) {
      webRef.current.injectJavaScript(`
        window.updatePlaces(${JSON.stringify(filteredPlaces)});
       true;
      `);
    }
}, [filteredPlaces, myLocation]);

  // Kakao Map에서 bounds 이벤트를 받아오는 로직 추가 (onMessage에서 처리)
  const onMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'marker_click') {
        setSelected(msg.place);
        setShowDetail(true);
      } else if (msg.type === 'bounds_changed') {
        if (boundsTimeout.current) clearTimeout(boundsTimeout.current);
        boundsTimeout.current = setTimeout(() => {
          const ids = new Set((msg.places || []).map(p => p._id));
          const matched = (filteredPlaces || []).filter(p => ids.has(p._id));
          setVisiblePlaces(matched);
        }, 500); // 0.5초 디바운스
      }
    } catch {}
  };

  const toggleFav = async (placeId) => {
    try {
      if (!placeId) return;
      const uid = userId || await AsyncStorage.getItem('userId');
      if (!uid) {
        Alert.alert('로그인이 필요합니다', '다시 로그인해주세요.');
        return;
      }
      const res = await axios.post(`${BACKEND_URL}/favorites/toggle`, { userId: uid, placeId });
      const { isFavorite } = res.data || {};

      setFavorites(prev => {
        const next = new Set(prev);
        if (isFavorite) next.add(placeId);
        else next.delete(placeId);
        return next;
      });

    // 필요하면 서버 상태와 완전 동기화
    // await fetchFavorites(uid);
    } catch (e) {
      console.log('toggleFav fail', e?.response?.data || e.message);
      Alert.alert('실패', '즐겨찾기 반영 실패');
    }
  };


  const focusOnPlace = (place) => {
    if (!place?.latitude || !place?.longitude) return;
    // WebView 내부 지도 이동 (재로딩 없이 부드럽게 이동)
    webRef.current?.injectJavaScript(`window.moveToLocation(${place.latitude}, ${place.longitude}); true;`);
    setSelected(place);
    setShowDetail(true);
  };

  const [locating, setLocating] = useState(false);
  const jumpToCurrent = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync(); // ✅ 수정
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 권한을 허용해주세요.');
        return;
      }
      let loc = await Location.getLastKnownPositionAsync().catch(() => null); // ✅ 수정
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // ✅ 수정
          mayShowUserSettingsDialog: false,
        });
      }
      const me = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMyLocation(me);
      webRef.current?.injectJavaScript(`window.updateMyLocation(${me.latitude}, ${me.longitude}); true;`);      
    } catch {
      Alert.alert('현재 위치 사용 불가');
    } finally {
      setLocating(false);
    }
  };

  // 장소 추가 (로컬/서버)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddr, setNewAddr] = useState('');
  const [newHours, setNewHours] = useState(''); // openingHours
  const [newTables, setNewTables] = useState('');
  const [newOutlets, setNewOutlets] = useState('');
  const [newType, setNewType] = useState('other');
  const [newWifi, setNewWifi] = useState(false);

  // 장소 추가
  const handleAddPlace = async () => {
    if (!newName.trim() || !newAddr.trim()) {
      Alert.alert('알림', '이름과 주소를 입력해주세요.');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/places/request-add`, {
        requestType: 'add',
        type: newType || 'other',
        name: newName.trim(),
        address: newAddr.trim(),
        openingHours: newHours.trim(),
        seatCount: parseInt(newTables) || 0,
        powerOutlet: parseInt(newOutlets) > 0, // 0보다 크면 true
        wifi: newWifi,
      }, {
        headers: { 'Content-Type': 'application/json' }, // ✅ body 보장
      });

      Alert.alert(
        '완료',
        '추가 요청이 접수되었습니다.\n관리자 검토 후 반영됩니다.',
        [{ text: '확인', onPress: () => setShowAddModal(false) }]
      );

      setNewName('');
      setNewAddr('');
      setNewHours('');
      setNewTables('');
      setNewOutlets('');
      setNewWifi(false);
    } catch (e) {
      console.error('❌ 장소 추가 요청 실패:', e);
      Alert.alert('실패', '추가 요청 전송에 실패했습니다.');
    }
  };


  // --------- 리스트 평점 보조 로딩 ---------
  const ensurePlaceRating = async (placeId) => {
    if (!placeId || ratingMap[placeId]) return;
    try {
      // 1) 평균 전용 API가 있으면 먼저 시도
      let avg = null, count = 0;
      try {
        const r1 = await axios.get(`${BACKEND_URL}/reviews/place/${placeId}/avg`);
        if (r1.data && typeof r1.data.avg === 'number') {
          avg = r1.data.avg;
          count = r1.data.count || 0;
        }
      } catch {}
      // 2) 없으면 전체 리뷰로 대체 계산
      if (avg == null) {
        const r2 = await axios.get(`${BACKEND_URL}/reviews/place/${placeId}`);
        const arr = Array.isArray(r2.data) ? r2.data : [];
        if (arr.length) {
          const sum = arr.reduce((a, c) => a + (c.rating || 0), 0);
          avg = Math.round((sum / arr.length) * 10) / 10;
          count = arr.length;
        } else {
          avg = 0; count = 0;
        }
      }
      setRatingMap(prev => ({ ...prev, [placeId]: { avg, count } }));
    } catch {
      setRatingMap(prev => ({ ...prev, [placeId]: { avg: 0, count: 0 } }));
    }
  };

  // 바텀시트 실제 높이 스타일
  const animatedSheetHeight = Animated.multiply(sheetHeight, WIN_H * MAX_SHEET_PCT);
  const sheetAnimatedStyle = { height: animatedSheetHeight };


  return (
    <View style={{ flex: 1 }}>
      {/* Kakao 지도 */}
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        style={StyleSheet.absoluteFillObject}
        onLoadEnd={() => {
          console.log('✅ WebView 로드 완료');
          if (filteredPlaces) {
            webRef.current.injectJavaScript(`
              window.updatePlaces(${JSON.stringify(filteredPlaces)});
              true;
            `);
          } 
        }}
        onError={(e) => console.error('❌ WebView 오류:', e.nativeEvent)}
      />

      {/* 상단 검색 + 필터 버튼 */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#8a8a8a" style={{ marginRight: 6 }} />
          <TextInput
            style={{ flex: 1, paddingVertical: 6 }}
            placeholder="장소 검색"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(true)}>
          <Ionicons name="options" size={18} color="#1f6feb" />
        </TouchableOpacity>
      </View>

      {/* 우측 플로팅: 현재 위치 / 즐겨찾기 / 장소 추가 */}
      <View style={styles.fabCol}>
        <TouchableOpacity style={styles.fab} onPress={jumpToCurrent} disabled={locating}>
          <Ionicons name={locating ? 'locate-outline' : 'locate'} size={18} color="#1f6feb" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, onlyFav && { backgroundColor: '#1f6feb' }]}
          onPress={() => setOnlyFav(v => !v)} // ✅ 수정: 맵 이동 없음, 리스트만 필터링
        >
          <Ionicons name={onlyFav ? 'star' : 'star-outline'} size={18} color={onlyFav ? '#fff' : '#1f6feb'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={22} color="#1f6feb" />
        </TouchableOpacity>
      </View>

      {/* 하단 드래그 리스트 (완전 내리기 ↔ 중간) */}
      <Animated.View
        style={[styles.listPanel, sheetAnimatedStyle]} // ✅ 수정: Animated height 적용
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.grabber} onPress={() => {
          // 탭으로 스냅 이동 (0 ↔ 0.5)
          sheetRatioRef.current = nextSnap(sheetHeight);
        }}>
          <View style={styles.grabberBar} />
        </TouchableOpacity>

        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderText}>
            {onlyFav ? `즐겨찾기 ${favorites.size}개` : `장소 ${visiblePlaces.length}개`}
          </Text>
          {onlyFav && <Text style={styles.favoriteHint}>★ 즐겨찾기 모드</Text>}
        </View>

				<FlatList
					data={listData.filter(p => p && typeof p === 'object')}
					keyExtractor={(item, idx) =>
						(item._id ? item._id.toString() : item.id ? item.id.toString() : String(idx))
					}
					onViewableItemsChanged={({ viewableItems }) => {
						viewableItems.forEach(v => ensurePlaceRating(v.item?._id));
					}}
					viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
					ListEmptyComponent={
						<Text style={{ padding: 12, color: '#777' }}>
							{onlyFav ? '즐겨찾기한 장소가 없습니다.' : '조건에 맞는 장소가 없습니다.'}
						</Text>
					}
					renderItem={({ item }) => {
						if (!item) return null;

						const tagType = toTypeLabelIcon(item.type);
						const r = ratingMap[item._id];
						const ratingText = r
							? `${(r.avg ?? 0).toFixed(1)}점 (${r.count ?? 0})`
							: '평점 계산 중…';

						return (
							<TouchableOpacity
								style={styles.listItem}
								onPress={() => { setSelected(item); setShowDetail(true); focusOnPlace(item); }}
							>
								<View style={{ flex: 1 }}>
									{/* 이름 + 타입 태그 */}
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
										<Text style={styles.listName}>{item.name || '이름 없음'}</Text>
										{tagType && (
											<View style={styles.typeTag}>
												<Ionicons name={tagType.icon} size={12} color="#fff" />
												<Text style={styles.typeTagText}>{tagType.label}</Text>
											</View>
										)}
									</View>

									{/* 주소 */}
									<Text style={styles.listAddr} numberOfLines={1}>
										{item.address || '주소 없음'}
									</Text>

									{/* 태그: 콘센트, 이용시간, Wi-Fi, 그룹 */}
									<View style={{ flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' }}>
										{item.powerOutlet ? <Pill text="콘센트" /> : null}
										{(item.openingHours || item.open_24h) ? (
											<Pill text={item.openingHours ? `시간 ${item.openingHours}` : '24시간'} />
										) : null}
										{item.wifi ? <Pill text="Wi-Fi" /> : null}
										{item.groupAvailable ? <Pill text="그룹 이용" /> : null}
									</View>

									{/* 평점 */}
									<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
										{[1, 2, 3, 4, 5].map(n => (
											<Ionicons
												key={n}
												name={
													r && r.avg >= n
														? 'star'
														: r && r.avg >= n - 0.5
														? 'star-half'
														: 'star-outline'
												}
												size={14}
												color="#f5a524"
												style={{ marginRight: 2 }}
											/>
										))}
										<Text style={{ marginLeft: 6, color: '#444', fontWeight: '600' }}>
											{ratingText}
										</Text>
									</View>
								</View>

								{/* 즐겨찾기 */}
								<TouchableOpacity onPress={() => toggleFav(item._id)} style={{ padding: 4 }}>
									<Ionicons
										name={favorites.has(item._id) ? 'star' : 'star-outline'}
										size={20}
										color="#f5a524"
									/>
								</TouchableOpacity>
							</TouchableOpacity>
						);
					}}
				/>

      </Animated.View>

      {/* 필터 모달 */}
      <Modal visible={showFilter} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFilter(false)} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>필터</Text>

          <RowSwitch label="콘센트 있음" on={onlyOutlets} toggle={() => setOnlyOutlets(v => !v)} />
          <RowSwitch label="24시간 운영" on={only24h} toggle={() => setOnly24h(v => !v)} />
          <RowSwitch label="그룹 이용 가능" on={onlyGroup} toggle={() => setOnlyGroup(v => !v)} />
          <RowSwitch label="Wi-Fi 있음" on={onlyWifi} toggle={() => setOnlyWifi(v => !v)} />

          <View style={styles.typeRow}>
            <TypeChip label="카페" on={typeCafe} onPress={() => setTypeCafe(v => !v)} icon={<Ionicons name="cafe" size={14} color={typeCafe ? '#fff' : '#6b7280'} />} />
            <TypeChip label="스터디" on={typeStudy} onPress={() => setTypeStudy(v => !v)} icon={<Ionicons name="school" size={14} color={typeStudy ? '#fff' : '#6b7280'} />} />
            <TypeChip label="도서관" on={typeLibrary} onPress={() => setTypeLibrary(v => !v)} icon={<Ionicons name="book" size={14} color={typeLibrary ? '#fff' : '#6b7280'} />} />
            <TypeChip label="기타" on={typeOther} onPress={() => setTypeOther(v => !v)} icon={<Ionicons name="location-outline" size={14} color={typeOther ? '#fff' : '#6b7280'} />}/>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnGhost} onPress={() => setShowFilter(false)}>
              <Text style={styles.btnGhostText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setShowFilter(false)}>
              <Text style={styles.btnPrimaryText}>적용</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 상세 바텀시트 */}
      <Modal visible={showDetail} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDetail(false)} />
        {selected && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailName}>{selected.name}</Text>
                <Text style={styles.detailAddr} numberOfLines={1}>{selected.address}</Text>
              </View>
              {/* ✅ 상세에서 바로 즐겨찾기 토글 */}
              <TouchableOpacity onPress={() => toggleFav(selected._id)}>
                <Ionicons name={favorites.has(selected._id) ? 'star' : 'star-outline'} size={22} color="#f5a524" />
              </TouchableOpacity>
            </View>

            <View style={styles.tagsRow}>
              <InfoTag on icon={toTypeLabelIcon(selected.type).icon} label={toTypeLabelIcon(selected.type).label} />
              <InfoTag on={!!selected.powerOutlet} icon="power-outline" label="콘센트" />
              {(selected.openingHours || selected.open_24h) ? (
                <InfoTag on icon="time-outline" label={selected.openingHours ? selected.openingHours : '24시간'} />
              ) : null}
              <InfoTag on={!!selected.wifi} icon="wifi" label="Wi-Fi" />
              <InfoTag on={!!selected.groupAvailable} icon="people-outline" label="그룹 이용" />
              {typeof selected.seatCount === 'number' && selected.seatCount > 0 ? (
                <InfoTag on icon="grid-outline" label={`좌석 ${selected.seatCount}`} />
              ) : null}

              {/* ✅ 전화번호 */}
              {selected.phone ? (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
                  <InfoTag on icon="call-outline" label={selected.phone} />
                </TouchableOpacity>
              ) : null}

              {/* ✅ 웹사이트 */}
              {selected.website ? (
                <TouchableOpacity onPress={() => Linking.openURL(selected.website)}>
                  <InfoTag on icon="globe-outline" label="웹사이트" />
                </TouchableOpacity>
              ) : null}

              {/* ✅ 24시간 */}
              {selected.open_24h ? (
                <InfoTag on icon="time-outline" label="24시간 운영" />
              ) : null}
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => {
                  const appUrl = `kakaomap://look?p=${selected.latitude},${selected.longitude}`;
                  const webUrl = `https://map.kakao.com/link/map/${encodeURIComponent(selected.name)},${selected.latitude},${selected.longitude}`;
                  Linking.openURL(appUrl).catch(() => Linking.openURL(webUrl));
                }}
              >
                <Text style={styles.btnGhostText}>길찾기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => navigation.navigate('PlaceReviewScreen', { placeId: selected._id, placeName: selected.name })}
              >
                <Text style={styles.btnPrimaryText}>리뷰</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => navigation.navigate('PlaceEditRequestScreen', { placeId: selected._id, initial: selected })}
              >
                <Text style={styles.btnPrimaryText}>정보수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* 장소 추가 모달 */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>장소 추가</Text>
            {/* ▼ 유형 선택 (카페/스터디/도서관/기타) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {[
              { t: 'cafe', label: '카페', icon: 'cafe' },
              { t: 'study', label: '스터디', icon: 'school' },
              { t: 'library', label: '도서관', icon: 'book' },
              { t: 'other', label: '기타', icon: 'location-outline' },
              ].map(({ t, label, icon }) => (
                <TouchableOpacity
                key={t}
                onPress={() => setNewType(t)}
                  style={[
                    styles.typeChip,
                    newType === t && styles.typeChipOn,
                    { paddingVertical: 6, paddingHorizontal: 10 },
                  ]}
                >
                  <Ionicons name={icon} size={14} color={newType === t ? '#fff' : '#6b7280'} />
                  <Text style={[styles.typeChipText, newType === t && { color: '#fff' }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.modalInput} placeholder="장소 이름 (필수)" value={newName} onChangeText={setNewName} />
            <TextInput style={styles.modalInput} placeholder="도로명 주소 (필수)" value={newAddr} onChangeText={setNewAddr} />
            <TextInput style={styles.modalInput} placeholder="운영시간 (예: 09:00~22:00)" value={newHours} onChangeText={setNewHours} />
            <TextInput style={styles.modalInput} placeholder="테이블 수 (예: 12)" value={newTables} onChangeText={setNewTables} keyboardType="numeric" />
            <TextInput style={styles.modalInput} placeholder="콘센트 수 (예: 8)" value={newOutlets} onChangeText={setNewOutlets} keyboardType="numeric" />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ marginRight: 8 }}>Wi-Fi 있음</Text>
              <TouchableOpacity
                onPress={() => setNewWifi(v => !v)}
                style={[styles.pill, newWifi && styles.pillOn]}
              >
                <Text style={[styles.pillText, newWifi && styles.pillTextOn]}>{newWifi ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setShowAddModal(false)}>
                <Text style={styles.btnGhostText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAddPlace(false)}>
                <Text style={styles.btnPrimaryText}>추가 요청</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingBadge}>
          <Text style={{ color: '#1f6feb', fontWeight: '600' }}>불러오는 중…</Text>
        </View>
      )}
    </View>
  );
}

/* -------------------- Kakao HTML -------------------- */
function buildKakaoHtml(appKey, center, places, myLocation) {
  const safePlaces = JSON.stringify(places || []);
  const me = myLocation ? JSON.stringify(myLocation) : 'null';

  // 마커 이미지(간단한 도형 대체; 필요시 sprite URL로 교체)
  return `
<!DOCTYPE html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%} .pin{width:18px;height:18px;border-radius:50%}</style>
<script>
  window.onerror = function(message, source, lineno, colno, error) {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
      type:'error', message, source, lineno, colno, error: error ? error.stack : null
    }));
  };
</script>
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false"></script>
</head><body><div id="map"></div>
<script>
  kakao.maps.load(function(){
    try{
      var center = {lat:${center.latitude}, lng:${center.longitude}};
      var map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(center.lat, center.lng), level: 4
      });

      function iconByType(t){
        if(t==='cafe') return '☕';        
        if(t==='study') return '📚';       
        if(t==='library') return '🏛️';    
        if(t==='me') return '📍';          
        return '📌';                       
      }

      var meMarker = null;
      window.moveToLocation = function(lat, lng){
        try {
          if (!map || typeof lat !== 'number' || typeof lng !== 'number') return;
          var pos = new kakao.maps.LatLng(lat, lng);
          map.setCenter(pos);
          map.panTo(pos);
        } catch (e) {}
      };

      window.updateMyLocation = function(lat, lng){
        try{
          var pos = new kakao.maps.LatLng(lat, lng);
          if (meMarker) {
            meMarker.setPosition(pos);
          } else {
            var el = document.createElement('div');
            el.style.fontSize = '20px'; el.textContent = '📍';
            meMarker = new kakao.maps.CustomOverlay({ position: pos, content: el, yAnchor: 1 });
            meMarker.setMap(map);
          }
          map.panTo(pos);
        }catch(e){}
      };

      // ✅ 마커 배열을 전역으로 유지
      if (!window.markers) window.markers = [];

      window.updatePlaces = function(places){
        try {
          // 전역 places 배열 갱신
          window.places = places || [];

          // 기존 마커 제거
          window.markers.forEach(m => m.setMap(null));
          window.markers = [];

          // 새로운 마커 생성
          window.places.forEach(p => {
            if(p && typeof p.latitude==='number' && typeof p.longitude==='number'){
              var el = document.createElement('div');
              el.style.fontSize = '20px';
              el.style.cursor = 'pointer';
              el.textContent = iconByType(p.type || 'other');
              var marker = new kakao.maps.CustomOverlay({
                position: new kakao.maps.LatLng(p.latitude, p.longitude),
                content: el,
                yAnchor: 1
              });
              marker.setMap(map);
              el.onclick = function(){
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                  JSON.stringify({type:'marker_click', place: p})
                );
              };
              window.markers.push(marker);
            }
          });
        }catch(e){}
      };

      // 초기 places 반영
      window.places = ${safePlaces};
      window.updatePlaces(window.places);

      kakao.maps.event.addListener(map, 'idle', function(){
        var bounds = map.getBounds();
        var visible = (window.places || []).filter(p => {
          try {
            var latlng = new kakao.maps.LatLng(p.latitude, p.longitude);
            return bounds.contain(latlng);
          } catch(e) {
            return false;
          }
        });
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'bounds_changed',
          places: visible
        }));
      });

      // 내 위치 마커 표시
      var me = ${me};
      if(me && typeof me.latitude==='number' && typeof me.longitude==='number'){
        var el = document.createElement('div');
        el.style.fontSize = '20px'; el.textContent = '📍';
        var myMarker = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(me.latitude, me.longitude),
          content: el,
          yAnchor: 1
        });
        myMarker.setMap(map);
      }

    }catch(err){
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'error', message:String(err)}));
    }
  });
</script>
</body></html>`;
}

/* -------------------- 작은 UI 컴포넌트 -------------------- */
function RowSwitch({ label, on, toggle }) {
  return (
    <View style={styles.rowBetween}>
      <Text>{label}</Text>
      <TouchableOpacity onPress={toggle} style={[styles.pill, on && styles.pillOn]}>
        <Text style={[styles.pillText, on && styles.pillTextOn]}>{on ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>
    </View>
  );
}
function TypeChip({ label, on, onPress, icon }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.typeChip, on && styles.typeChipOn]}>
      {icon}
      <Text style={[styles.typeChipText, on && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}
function InfoTag({ on, icon, label }) {
  return (
    <View style={[styles.infoTag, on ? styles.infoOn : styles.infoOff]}>
      <Ionicons name={icon} size={12} color={on ? '#0a7' : '#6b7280'} />
      <Text style={[styles.infoTagText, on ? { color: '#0a7' } : { color: '#6b7280' }]}>{label}</Text>
    </View>
  );
}
function Pill({ text }) {
  return (
    <View style={{ borderWidth:1, borderColor:'#cbd5e1', borderRadius:999, paddingHorizontal:8, paddingVertical:2, marginRight:6, marginBottom:6 }}>
      <Text style={{ fontSize:11, color:'#445' }}>{text}</Text>
    </View>
  );
}

// ✅ 스냅 계산 (2단계: 0 ↔ 0.5)
function snapTo(val, vy) {
  const current = val.__getValue();
  const points = SNAP_POINTS;
  let target = points[0];
  let min = 999;
  for (const p of points) {
    const d = Math.abs(current - p);
    if (d < min) {
      min = d; target = p;
    }
  }
  Animated.spring(val, { toValue: target, useNativeDriver: false, bounciness: 0 }).start();
  return target;
}

function nextSnap(val){
  const current = val.__getValue();
  const points = SNAP_POINTS;
  const idx = points.findIndex(p => Math.abs(p - current) < 0.02);
  const next = points[(idx + 1) % points.length];
  Animated.spring(val, { toValue: next, useNativeDriver: false, bounciness: 0 }).start();
  return next;
}
function toTypeLabelIcon(t){
  switch(t){
    case 'cafe': return { label: '카페', icon: 'cafe' };
    case 'study': return { label: '스터디', icon: 'school' };
    case 'library': return { label: '도서관', icon: 'book' };
    case 'other': return { label: '기타', icon: 'location-outline' };
    default: return { label: '알수없음', icon: 'help-circle-outline' };
  }
}

const styles = StyleSheet.create({
  topBar: { position:'absolute', top:Platform.select({ios:60,android:30}), left:14, right:14, flexDirection:'row', alignItems:'center', zIndex: 10 },
  searchBox: { flex:1, backgroundColor:'#fff', borderRadius:12, paddingHorizontal:10, paddingVertical:6,
    shadowColor:'#000', shadowOpacity:0.12, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:2, flexDirection:'row', alignItems:'center' },
  filterBtn: { marginLeft:8, width:40, height:40, borderRadius:12, backgroundColor:'#fff', justifyContent:'center', alignItems:'center',
    shadowColor:'#000', shadowOpacity:0.12, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:2 },

  fabCol: { position:'absolute', right:14, top:Platform.select({ ios:170, android:140 }), gap:10, zIndex: 10 },
  fab: { width:44, height:44, borderRadius:12, backgroundColor:'#fff', justifyContent:'center', alignItems:'center',
    shadowColor:'#000', shadowOpacity:0.12, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:2 },

  // ✅ 리스트 패널은 Animated height를 사용
  listPanel: {position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
     paddingTop: 6, paddingHorizontal: 8, zIndex: 5, overflow: 'hidden', minHeight: 28},
  grabber: { alignItems:'center', paddingVertical:6 },
  grabberBar: { width:40, height:4, borderRadius:2, backgroundColor:'#d1d5db' },
  listHeaderRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:6, paddingBottom:6 },
  listHeaderText: { fontWeight:'700', color:'#111' },
  favoriteHint: { fontSize:12, color:'#f59e0b', fontWeight:'700' },
  listItem: { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    borderBottomWidth:1, borderBottomColor:'#eee', paddingVertical:10, gap:8 },
  listName: { fontWeight:'bold', fontSize:14 },
  listAddr: { fontSize:12, color:'#555', marginTop:2, maxWidth:'95%' },

  // ✅ 타입 태그 스타일 추가
  typeTag: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#1f6feb',
    borderRadius:999, paddingHorizontal:8, paddingVertical:2 },
  typeTagText: { fontSize:10, color:'#fff', fontWeight:'700' },

  modalBackdrop: { flex:1, backgroundColor:'rgba(0,0,0,0.25)' },
  modalCard: { position:'absolute', left:0, right:0, bottom:0, backgroundColor:'#fff', borderTopLeftRadius:16, borderTopRightRadius:16, padding:16 },
  modalTitle: { fontSize:16, fontWeight:'700', marginBottom:6 },
  rowBetween: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:10 },
  pill: { borderWidth:1, borderColor:'#cbd5e1', borderRadius:999, paddingHorizontal:12, paddingVertical:6 },
  pillOn: { backgroundColor:'#1f6feb', borderColor:'#1f6feb' },
  pillText: { color:'#374151', fontWeight:'600' },
  pillTextOn: { color:'#fff' },

  typeRow: { flexDirection:'row', gap:8, marginTop:12, flexWrap: 'wrap' },
  typeChip: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:8, borderRadius:999, borderWidth:1, borderColor:'#cbd5e1' },
  typeChipOn: { backgroundColor:'#1f6feb', borderColor:'#1f6feb' },
  typeChipText: { color:'#6b7280', fontWeight:'600' },

  detailCard: { position:'absolute', left:0, right:0, bottom:0, backgroundColor:'#fff', borderTopLeftRadius:16, borderTopRightRadius:16, padding:16 },
  detailHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  detailName: { fontSize:16, fontWeight:'700' },
  detailAddr: { color:'#6b7280', marginTop:2, maxWidth:240 },
  tagsRow: { flexDirection:'row', gap:8, marginTop:12, flexWrap: 'wrap' },
  infoTag: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:6, borderRadius:999, borderWidth:1 },
  infoOn: { borderColor:'#0a7' }, infoOff: { borderColor:'#cbd5e1' },
  infoTagText: { fontWeight:'600' },

  detailActions: { flexDirection:'row', justifyContent:'flex-end', gap:10, marginTop:12 },
  btnGhost: { paddingHorizontal:14, paddingVertical:10, borderRadius:10, borderWidth:1, borderColor:'#cbd5e1' },
  btnGhostText: { color:'#1f2a3a', fontWeight:'700' },
  btnPrimary: { paddingHorizontal:14, paddingVertical:10, borderRadius:10, backgroundColor:'#1f6feb' },
  btnPrimaryText: { color:'#fff', fontWeight:'700' },

  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center' },
  modalInput: { borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginBottom:8 },

  loadingBadge: { position:'absolute', top:Platform.select({ ios:60, android:30 }), alignSelf:'center', backgroundColor:'#fff',
    borderRadius:999, paddingHorizontal:12, paddingVertical:6, shadowColor:'#000', shadowOpacity:0.12, shadowRadius:6, shadowOffset:{width:0,height:2} },
});
