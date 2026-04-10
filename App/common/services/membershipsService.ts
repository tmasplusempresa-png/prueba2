/**
 * Servicio para obtener memberships usando HTTP REST de Supabase
 * SIN depender del SDK que tiene problemas de RLS
 */

import Constants from 'expo-constants';
import { supabase } from '@/config/SupabaseConfig';

const extra = Constants.expoConfig?.extra || {};
const SUPABASE_URL = extra.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY as string;

interface MembershipData {
  uid: string;
  conductor: string;
  status: string;
  costo: number;
  fecha_inicio: string;
  fecha_terminada: string;
  periodo: number;
  created_at: string;
  updated_at: string;
}

/**
 * Obtener memberships usando HTTP REST
 * Evita problemas de RLS del SDK
 */
export const getMembershipsViaREST = async (conductorId: string): Promise<MembershipData[]> => {
  try {
    console.log('🌐 [REST] Obteniendo memberships via HTTP REST para:', conductorId);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Falta SUPABASE_URL o SUPABASE_ANON_KEY');
      return [];
    }

    // 🔗 URL de REST: /rest/v1/memberships?conductor=eq.{id}&order=created_at.desc
    const url = `${SUPABASE_URL}/rest/v1/memberships?conductor=eq.${conductorId}&order=created_at.desc`;

    console.log('📡 GET:', url.substring(0, 100) + '...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    });

    console.log('📊 HTTP Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error HTTP:', response.status, errorText);
      return [];
    }

    const data: MembershipData[] = await response.json();
    console.log('✅ Memberships obtenidas via REST:', data.length);
    
    if (data.length > 0) {
      console.log('📋 Primera membresía:', {
        uid: data[0].uid,
        status: data[0].status,
        fecha_terminada: data[0].fecha_terminada,
      });
    }

    return data;
  } catch (error) {
    console.error('❌ Error en getMembershipsViaREST:', error);
    return [];
  }
};

/**
 * Obtener memberships usando SDK de Supabase
 * (Fallback si REST falla)
 */
export const getMembershipsViaSDK = async (conductorId: string): Promise<MembershipData[]> => {
  try {
    console.log('🔷 [SDK] Obteniendo memberships via SDK para:', conductorId);

    const { data, error, status } = await supabase
      .from('memberships')
      .select('uid, conductor, status, costo, fecha_inicio, fecha_terminada, periodo, created_at, updated_at')
      .eq('conductor', conductorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error SDK:', error.message);
      return [];
    }

    console.log('✅ Memberships obtenidas via SDK:', data?.length || 0);
    return (data as MembershipData[]) || [];
  } catch (error) {
    console.error('❌ Exception en getMembershipsViaSDK:', error);
    return [];
  }
};

/**
 * Obtener memberships - intenta REST primero, fallback a SDK
 */
export const getMemberships = async (conductorId: string): Promise<MembershipData[]> => {
  console.log('🔄 Obteniendo memberships para:', conductorId);

  // Intentar REST primero (más confiable sin RLS)
  let data = await getMembershipsViaREST(conductorId);

  if (data.length > 0) {
    return data;
  }

  // Si REST no retorna, fallback a SDK
  console.log('⚠️ REST no retornó datos, intentando SDK...');
  data = await getMembershipsViaSDK(conductorId);

  return data;
};
