// src/utils/NotificationFunctions.ts
import { app } from "@/config/SupabaseConfig";

let messaging: any = null;
let getTokenFn: any = null;
let onMessageFn: any = null;
try {
  // Require firebase/messaging at runtime — may not be available in Expo dev without native module
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const firebaseMessaging = require("firebase/messaging");
  const { getMessaging, getToken, onMessage } = firebaseMessaging;
  if (getMessaging && app) {
    messaging = getMessaging(app);
  }
  getTokenFn = getToken;
  onMessageFn = onMessage;
} catch (e) {
  messaging = null;
  getTokenFn = null;
  onMessageFn = null;
}

export const sendNotification = async (token: string, title: string, body: string) => {
  const message = {
    notification: {
      title,
      body,
    },
    to: token,
  };

  try {
    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify(message),
    });
    //console.log("Notificación enviada con éxito");
  } catch (error) {
    console.error("Error al enviar la notificación:", error);
  }
};

// Función para obtener el token de notificación
export const getNotificationToken = async () => {
  if (!getTokenFn || !messaging) {
    console.warn("Firebase messaging not available - cannot get notification token.");
    return null;
  }
  try {
    const token = await getTokenFn(messaging, { vapidKey: process.env.FIREBASE_VAPID_KEY });
    return token ?? null;
  } catch (error) {
    console.error("Error al obtener el token de notificación:", error);
    return null;
  }
};

// Función para escuchar mensajes en primer plano
export const onMessageListener = () => {
  if (!onMessageFn || !messaging) {
    // No-op when messaging isn't available
    return () => {};
  }
  onMessageFn(messaging, (payload: any) => {
    //console.log("Mensaje recibido en primer plano:", payload);
  });
};



export const sendRideShareNotification = async (_userId: any, _rideData: any) => {
  // Server-side notification sending isn't available in this runtime.
  // This function is a safe no-op here — implement server-side push via Supabase edge function or a backend.
  console.warn("sendRideShareNotification: not available in this environment. Use server-side push.");
};