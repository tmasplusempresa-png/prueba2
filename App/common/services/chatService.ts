// ============================================================================
// chatService — mensajería del servicio (conductor <-> cliente) sobre Supabase
// ============================================================================
// Usa fetch REST directo con el JWT del usuario (getSupabaseAuthHeaders) en vez
// del SDK, porque en RN supabase.auth.getSession()/llamadas del SDK pueden
// colgarse (deadlock del lock de auth). Las pantallas hacen polling con
// fetchMessages() y envían con sendMessage().
// ============================================================================
import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';

export type ChatRole = 'driver' | 'customer';

export interface ChatMessage {
  id: string;
  booking_id: string;
  sender_id: string | null;
  sender_role: ChatRole;
  sender_name: string | null;
  message: string;
  created_at: string;
}

export interface SendMessageInput {
  bookingId: string;
  senderId?: string | null;
  senderRole: ChatRole;
  senderName?: string | null;
  message: string;
}

/**
 * Obtiene los mensajes de una reserva ordenados cronológicamente.
 * Devuelve [] ante cualquier error para no romper el polling de la UI.
 */
export const fetchMessages = async (bookingId: string): Promise<ChatMessage[]> => {
  if (!bookingId) return [];
  try {
    const headers = await getSupabaseAuthHeaders();
    const url =
      `${SUPABASE_URL}/rest/v1/chat_messages` +
      `?booking_id=eq.${encodeURIComponent(bookingId)}` +
      `&select=*&order=created_at.asc`;

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const text = await res.text();
      console.error('chatService.fetchMessages error:', res.status, text);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? (data as ChatMessage[]) : [];
  } catch (error) {
    console.error('chatService.fetchMessages exception:', error);
    return [];
  }
};

/**
 * Inserta un mensaje y devuelve la fila creada (o null si falla).
 */
export const sendMessage = async (
  input: SendMessageInput
): Promise<ChatMessage | null> => {
  const { bookingId, senderId, senderRole, senderName, message } = input;
  if (!bookingId || !message?.trim()) return null;

  try {
    const headers = await getSupabaseAuthHeaders(true);
    const url = `${SUPABASE_URL}/rest/v1/chat_messages`;
    const payload = {
      booking_id: bookingId,
      sender_id: senderId || null,
      sender_role: senderRole,
      sender_name: senderName || null,
      message: message.trim(),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('chatService.sendMessage error:', res.status, text);
      return null;
    }

    const data = await res.json();
    return Array.isArray(data) ? (data[0] as ChatMessage) : (data as ChatMessage);
  } catch (error) {
    console.error('chatService.sendMessage exception:', error);
    return null;
  }
};
