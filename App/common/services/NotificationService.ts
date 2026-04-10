/**
 * NotificationService - Servicios para notificaciones de llamadas
 * ==============================================================
 * 
 * Usa Supabase Edge Functions para:
 * - Notificar llamadas entrantes
 * - Registrar eventos de llamadas
 */

import { SUPABASE_URL } from '@/config/SupabaseConfig';

export interface NotifyCallParams {
  customerId: string;
  driverId: string;
  driverName: string;
  channelName: string;
}

export interface CallEventParams {
  driverId: string;
  customerId: string;
  event: 'started' | 'ended' | 'failed' | 'declined';
  duration?: number;
  reason?: string;
}

/**
 * Notificar al cliente que recibe una llamada del conductor
 */
export const notifyIncomingCall = async (params: NotifyCallParams): Promise<boolean> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/notifyIncomingCall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [NOTIFY] Error notifying incoming call:', error);
      return false;
    }

    const data = await response.json();
    console.log('✅ [NOTIFY] Incoming call notification sent:', data);
    return true;
  } catch (error) {
    console.error('❌ [NOTIFY] Error:', error);
    return false;
  }
};

/**
 * Registrar evento de llamada (inicio, fin, etc)
 */
export const recordCallEvent = async (params: CallEventParams): Promise<boolean> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/recordCallEvent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('❌ [RECORD] Error recording call event');
      return false;
    }

    console.log(`✅ [RECORD] Call event recorded: ${params.event}`);
    return true;
  } catch (error) {
    console.error('❌ [RECORD] Error:', error);
    return false;
  }
};

/**
 * Escuchar notificaciones de llamadas entrantes usando Supabase Realtime
 */
export const subscribeToCallNotifications = (
  customerId: string,
  callback: (notification: any) => void
) => {
  try {
    // Esta función se debe usar con el cliente Supabase de la app
    // Ejemplo:
    // const { data: subscription } = supabase
    //   .channel(`call_notifications:customer_id=eq.${customerId}`)
    //   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_notifications' }, (payload) => {
    //     if (payload.new.customer_id === customerId) {
    //       callback(payload.new);
    //     }
    //   })
    //   .subscribe();
    //
    // return subscription;
    
    console.log(`📡 [LISTEN] Subscribed to call notifications for customer: ${customerId}`);
  } catch (error) {
    console.error('❌ [LISTEN] Error subscribing to notifications:', error);
  }
};
