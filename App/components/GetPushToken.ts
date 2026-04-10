import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { AppConfig } from '@/config/AppConfig';
import Constants from 'expo-constants';
import { setupDriverNotificationChannel } from '@/hooks/DriverNotificationService';

let firebaseMessagingModule: any = null;
try {
  // Try to require the native firebase messaging module at runtime.
  // It may not be available in Expo Go / dev builds.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  firebaseMessagingModule = require('@react-native-firebase/messaging');
} catch (e) {
  firebaseMessagingModule = null;
}

export default async function GetPushToken() {

  // No ejecutar push token flow en Expo Go (no soporta push remotas)
  if (Constants.appOwnership === 'expo') {
    console.warn('GetPushToken: running in Expo Go — skipping native push token retrieval. Use a dev client to test push.');
    return null;
  }

  let token;  
  if (Device.isDevice) {
    try {
      const Notifications = await import('expo-notifications');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return null;
      }
      const ref = { projectId: AppConfig.expo_project_id };
      token = (await Notifications.getExpoPushTokenAsync(ref)).data;
    } catch (err) {
      console.warn('GetPushToken: expo-notifications not available', err);
      return null;
    }
  }

  if (Platform.OS === 'android') {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00f4f5',
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('bookings', {
        name: 'Booking notifications',
        sound: 'horn.wav',
      });
      await Notifications.setNotificationChannelAsync('bookings-repeat', {
        name: 'Booking long notifications',
        sound: 'repeat.wav',
      });

      // Persistent driver notification channel
      await setupDriverNotificationChannel();
    } catch (err) {
      console.warn('Could not set Android notification channels (expo-notifications not available):', err);
    }
  }
  return token;
}


export async function registerForPushNotificationsAsync() {
  // Prefer native FCM when available
  if (firebaseMessagingModule) {
    try {
      const messagingFactory = typeof firebaseMessagingModule === 'function' ? firebaseMessagingModule : firebaseMessagingModule.default;
      if (typeof messagingFactory === 'function') {
        const m = messagingFactory();
        await m.requestPermission();
        const token = await m.getToken();
        return token;
      }
    } catch (e) {
      console.warn('FCM messaging not available at runtime:', e);
    }
  }

  // Fallback to Expo push token
  try {
    const Notifications = await import('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    const ref = { projectId: AppConfig.expo_project_id };
    const expoToken = (await Notifications.getExpoPushTokenAsync(ref)).data;
    return expoToken;
  } catch (e) {
    console.error('Error getting expo push token', e);
    return null;
  }
}