// front/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const MY_PLACES_KEY = 'MY_PLACES';

export async function getMyPlaces() {
  try {
    const json = await AsyncStorage.getItem(MY_PLACES_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('❌ 내 장소 불러오기 실패:', e);
    return [];
  }
}

export async function saveMyPlace(place) {
  try {
    const places = await getMyPlaces();
    places.push({ ...place, id: Date.now().toString() });
    await AsyncStorage.setItem(MY_PLACES_KEY, JSON.stringify(places));
  } catch (e) {
    console.error('❌ 내 장소 저장 실패:', e);
  }
}

export async function removeMyPlace(id) {
  try {
    const places = await getMyPlaces();
    const updated = places.filter(p => p.id !== id);
    await AsyncStorage.setItem(MY_PLACES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('❌ 내 장소 삭제 실패:', e);
  }
}

export async function clearMyPlaces() {
  try {
    await AsyncStorage.removeItem(MY_PLACES_KEY);
  } catch (e) {
    console.error('❌ 내 장소 전체삭제 실패:', e);
  }
}
