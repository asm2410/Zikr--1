import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { setCoordinates } from './prayerTimes';
import {
  LOCATION_LAT_KEY, LOCATION_LNG_KEY, LOCATION_TIMEZONE_KEY,
  LOCATION_CITY_KEY, TRAVELER_MODE_KEY,
} from '../constants';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  timezone: string;
  city: string;
  country: string;
}

async function fetchFromIP(): Promise<LocationInfo | null> {
  try {
    const res = await fetch('https://ip-api.com/json/', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.status === 'success') {
      return {
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone,
        city: data.city,
        country: data.country,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
}

async function saveToStorage(info: LocationInfo): Promise<void> {
  const pairs: [string, string][] = [
    [LOCATION_LAT_KEY, String(info.latitude)],
    [LOCATION_LNG_KEY, String(info.longitude)],
    [LOCATION_TIMEZONE_KEY, info.timezone],
  ];
  if (info.city) {
    pairs.push([LOCATION_CITY_KEY, info.city]);
  }
  await AsyncStorage.multiSet(pairs);
}

export async function initLocation(): Promise<void> {
  const savedLat = await AsyncStorage.getItem(LOCATION_LAT_KEY);
  const savedCity = await AsyncStorage.getItem(LOCATION_CITY_KEY);
  if (savedLat) {
    const savedLng = await AsyncStorage.getItem(LOCATION_LNG_KEY);
    if (savedLat && savedLng) {
      setCoordinates(parseFloat(savedLat), parseFloat(savedLng));
    }
    if (!savedCity) {
      try {
        const lat = parseFloat(savedLat);
        const lng = savedLng ? parseFloat(savedLng) : 0;
        const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          const cityName = addr.city || addr.region || addr.name || '';
          if (cityName) {
            await AsyncStorage.setItem(LOCATION_CITY_KEY, cityName);
          }
        }
      } catch {
        await updateLocationFromIP();
      }
    }
    return;
  }
  const success = await updateLocationFromGPS();
  if (!success) {
    const info = await fetchFromIP();
    if (info) {
      await saveToStorage(info);
      setCoordinates(info.latitude, info.longitude);
    }
  }
}

export async function detectTimezoneChange(): Promise<{ changed: boolean; savedTimezone: string | null; currentTimezone: string }> {
  const savedTimezone = await AsyncStorage.getItem(LOCATION_TIMEZONE_KEY);
  const currentTimezone = getDeviceTimezone();
  return { changed: !!(savedTimezone && savedTimezone !== currentTimezone), savedTimezone, currentTimezone };
}

export async function getSavedCity(): Promise<string | null> {
  return AsyncStorage.getItem(LOCATION_CITY_KEY);
}

export async function updateLocationFromIP(): Promise<boolean> {
  const info = await fetchFromIP();
  if (!info) return false;
  await saveToStorage(info);
  setCoordinates(info.latitude, info.longitude);
  return true;
}

export async function updateLocationFromGPS(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return await updateLocationFromIP();
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = loc.coords;
    setCoordinates(latitude, longitude);

    let cityName = '';
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        cityName = addr.city || addr.region || addr.name || '';
      }
    } catch {}

    const timezone = getDeviceTimezone();
    const pairs: [string, string][] = [
      [LOCATION_LAT_KEY, String(latitude)],
      [LOCATION_LNG_KEY, String(longitude)],
      [LOCATION_TIMEZONE_KEY, timezone],
    ];
    if (cityName) {
      pairs.push([LOCATION_CITY_KEY, cityName]);
    }
    await AsyncStorage.multiSet(pairs);

    if (!cityName) {
      await updateLocationFromIP();
    }

    return true;
  } catch {
    return await updateLocationFromIP();
  }
}

export async function getTravelerMode(): Promise<boolean> {
  const v = await AsyncStorage.getItem(TRAVELER_MODE_KEY);
  return v === 'true';
}

export async function setTravelerMode(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(TRAVELER_MODE_KEY, String(enabled));
}
