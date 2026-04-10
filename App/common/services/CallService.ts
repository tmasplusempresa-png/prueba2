/**
 * CallService - Gestión simple de llamadas con Agora UIKit
 * ======================================================
 * 
 * Wrapper simple alrededor de Agora RN UIKit
 */

export interface CallConnection {
  appId: string;
  channel: string;
  token: string | null;
  uid?: number;
}

export interface CallUser {
  userId: string;
  name: string;
  phone: string;
  image?: string;
}

/**
 * Generar channel ID único para 1-to-1 call
 */
export const generateChannelId = (userId1: string, userId2: string): string => {
  const ids = [userId1, userId2].sort();
  return `call_${ids[0]}_${ids[1]}`;
};

/**
 * Crear configuración para Agora UIKit
 */
export const createAgoraConnection = (
  appId: string,
  channel: string,
  token?: string,
  uid?: number
): CallConnection => {
  return {
    appId,
    channel,
    token: token || null,
    uid,
  };
};
