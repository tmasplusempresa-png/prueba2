/**
 * Configuración de Agora RTC
 * ========================
 * 
 * Settings para las llamadas P2P con Agora
 */

import Constants from 'expo-constants';

const getEnv = (name: string, defaultValue: string = ''): string => {
  try {
    if (process.env && process.env[name]) return process.env[name] as string;
    const extras = (Constants.expoConfig && (Constants.expoConfig as any).extra) || {};
    if (extras && extras[name]) return extras[name];
  } catch (e) {
    // ignore
  }
  return defaultValue;
};

/**
 * App ID de Agora
 * 
 * App ID usado: e7f6e9aeecf14b2ba10e3f40be9f56e7 (del ejemplo)
 * 
 * IMPORTANTE: Para producción, obten tu propio App ID en:
 * https://console.agora.io
 */
export const AGORA_APP_ID = getEnv(
  'AGORA_APP_ID',
  'e7f6e9aeecf14b2ba10e3f40be9f56e7' // App ID del ejemplo
);

/**
 * Token de Agora (generado por servidor)
 * 
 * En producción, SIEMPRE debes generar tokens en tu servidor backend
 * NUNCA expongas tu Primary Certificate en el cliente
 * 
 * Deixar undefined para usar modo sin token (solo para testing/desarrollo)
 */
export const AGORA_TOKEN = getEnv('AGORA_TOKEN', undefined);

/**
 * Opciones por defecto para llamadas
 */
export const AGORA_DEFAULTS = {
  audioProfile: 1,      // High quality audio
  audioScenario: 3,     // 1-to-1 communication
  enableAudioVolumeIndication: true,
  volume: 100,
};

export const AgoraConfig = {
  appId: AGORA_APP_ID,
  token: AGORA_TOKEN,
  defaults: AGORA_DEFAULTS,
};

export default AgoraConfig;
