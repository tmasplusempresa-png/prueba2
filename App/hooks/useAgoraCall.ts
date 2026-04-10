/**
 * useAgoraCall - Hook para manejar llamadas con Agora UIKit
 * ======================================================
 * 
 * Hook personalizado que encapsula llamadas P2P con generación de tokens
 * desde Supabase Edge Functions.
 */

import { useState, useCallback } from 'react';
import { generateChannelId } from '@/common/services/CallService';
import { SUPABASE_URL } from '@/config/SupabaseConfig';

export interface CallUserInfo {
  userId: string;
  name: string;
  phone: string;
  image?: string;
}

export interface UseAgoraCallOptions {
  appId: string;
  userId: string;
  userName: string;
  userPhone: string;
  userImage?: string;
}

/**
 * Generar token desde Supabase Edge Function
 * COMENTADO PARA EXPO GO - Des-comentar para compilación nativa
 */
const generateAgoraToken = async (
  channel: string,
  uid: number,
  role: 'publisher' | 'subscriber' = 'publisher'
): Promise<string> => {
  try {
    // COMENTADO TEMPORALMENTE PARA EXPO GO
    // const response = await fetch(`${SUPABASE_URL}/functions/v1/generateAgoraToken`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ channel, uid, role }),
    // });
    // if (!response.ok) {
    //   throw new Error(`Token generation failed with status ${response.status}`);
    // }
    // const data = await response.json();
    // return data.token;
    
    // Mock token for Expo Go
    return 'mock-token-for-expo-go';
  } catch (error) {
    console.error('❌ Error generating Agora token:', error);
    throw error;
  }
};

export const useAgoraCall = (options: UseAgoraCallOptions) => {
  const [callActive, setCallActive] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [remoteUser, setRemoteUser] = useState<CallUserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  /**
   * Hacer una llamada
   * COMENTADO PARA EXPO GO - Solo modo mock
   */
  const makeCall = useCallback(async (targetUser: CallUserInfo) => {
    try {
      // COMENTADO PARA EXPO GO
      // const channel = generateChannelId(options.userId, targetUser.userId);
      // const uid = parseInt((options.userId || '0').replace(/\D/g, '')) || 0;
      // console.log(`📞 [CALL] Iniciando llamada en canal: ${channel}`);
      // setChannelName(channel);
      // setRemoteUser(targetUser);
      // setIsLoadingToken(true);
      // const agoraToken = await generateAgoraToken(channel, uid, 'publisher');
      // setToken(agoraToken);
      // setCallActive(true);
      // console.log(`✅ [CALL] Token generado, estableciendo llamada...`);
      
      console.log('📞 [CALL] Mock mode - Compilación nativa requerida para video real');
    } catch (error) {
      console.error('❌ Make call error:', error);
      setCallActive(false);
    } finally {
      setIsLoadingToken(false);
    }
  }, [options.userId]);

  /**
   * Aceptar una llamada
   * COMENTADO PARA EXPO GO
   */
  const acceptCall = useCallback(async (targetUser: CallUserInfo) => {
    try {
      // COMENTADO PARA EXPO GO
      // const channel = generateChannelId(options.userId, targetUser.userId);
      // const uid = parseInt((options.userId || '0').replace(/\D/g, '')) || 0;
      // console.log(`✅ [CALL] Aceptando llamada en canal: ${channel}`);
      // setChannelName(channel);
      // setRemoteUser(targetUser);
      // setIsLoadingToken(true);
      // const agoraToken = await generateAgoraToken(channel, uid, 'publisher');
      // setToken(agoraToken);
      // setCallActive(true);
      // console.log(`✅ [CALL] Llamada aceptada, token generado`);
      
      console.log('📞 [CALL] Mock acceptance - Compilación nativa requerida');
    } catch (error) {
      console.error('❌ Accept call error:', error);
      setCallActive(false);
    } finally {
      setIsLoadingToken(false);
    }
  }, [options.userId]);

  /**
   * Terminar llamada
   */
  const endCall = useCallback(() => {
    try {
      setCallActive(false);
      setChannelName('');
      setRemoteUser(null);
      setToken(null);
      setIsLoadingToken(false);
      console.log('✅ [CALL] Llamada terminada');
    } catch (error) {
      console.error('❌ End call error:', error);
    }
  }, []);

  return {
    // Estados
    callActive,
    channelName,
    remoteUser,
    token,
    isLoadingToken,

    // Acciones
    makeCall,
    acceptCall,
    endCall,
  };
};
