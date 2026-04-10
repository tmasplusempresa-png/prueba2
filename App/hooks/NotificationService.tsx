
import Constants from 'expo-constants';
/* import messaging from "@react-native-firebase/messaging"; */

let firebaseMessagingModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  firebaseMessagingModule = require("@react-native-firebase/messaging");
} catch (e) {
  firebaseMessagingModule = null;
}

export const setupNotificationHandler = async () => {
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.warn('setupNotificationHandler: expo-notifications not available', e);
  }
};

export const registerForPushNotificationsAsync = async () => {
  try {
    if (Constants.appOwnership === 'expo') {
      console.warn('registerForPushNotificationsAsync: running in Expo Go — skipping Expo push token retrieval. Use a dev client to test.');
      return null;
    }
    const Notifications = await import('expo-notifications');
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.error('Error getting push token', error);
    return null;
  }
};

export const handleNotificationEvents = () => {
  if (!firebaseMessagingModule) {
    console.warn('Firebase messaging native module not available — skipping FCM handlers.');
    return;
  }

  const getMessagingInstance = () => {
    try {
      const factory = typeof firebaseMessagingModule === 'function' ? firebaseMessagingModule : firebaseMessagingModule.default;
      if (typeof factory === 'function') return factory();
    } catch (e) {
      // ignore
    }
    return null;
  };

  const m = getMessagingInstance();
  if (!m) {
    console.warn('Could not obtain messaging instance — skipping FCM handlers.');
    return;
  }

  m.onNotificationOpenedApp((remoteMessage: any) => {
    // console.log(
    //   'Notification caused app to open from background state:',
    //   remoteMessage.notification
    // );
  });

  m.getInitialNotification().then((initialNotification: any) => {
    if (initialNotification) {
      // console.log(
      //   'Notification caused app to open from quit state:',
      //   initialNotification.notification
      // );
    }
  });

  m.onMessage(async (remoteMessage: any) => {
    // console.log('A new FCM message arrived!', remoteMessage);
  });
};
