// ============================================================================
// chatService — mensajería del servicio (conductor <-> cliente) sobre Supabase
// ============================================================================
// Usa fetch REST directo con el JWT del usuario (getSupabaseAuthHeaders) en vez
// del SDK, porque en RN supabase.auth.getSession()/llamadas del SDK pueden
// colgarse (deadlock del lock de auth). Las pantallas hacen polling con
// fetchMessages() y envían con sendMessage().
//
// Esquema aplicacioncore: tabla `mensaje_chat`
//   id_reserva, id_remitente, rol_remitente (cliente|conductor), mensaje,
//   remitente_nombre, creado_en
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const CHAT_TABLE = 'mensaje_chat';

const lastReadKey = (bookingId: string, role: ChatRole) =>
  `chat_last_read_${bookingId}_${role}`;

const toDbRole = (role: ChatRole): 'cliente' | 'conductor' =>
  role === 'driver' ? 'conductor' : 'cliente';

const fromDbRole = (rol: string | null | undefined): ChatRole =>
  String(rol || '').toLowerCase() === 'conductor' ? 'driver' : 'customer';

const mapRow = (row: any): ChatMessage => ({
  id: String(row.id),
  booking_id: String(row.id_reserva ?? row.booking_id ?? ''),
  sender_id: row.id_remitente ?? row.sender_id ?? null,
  sender_role: fromDbRole(row.rol_remitente ?? row.sender_role),
  sender_name: row.remitente_nombre ?? row.sender_name ?? null,
  message: String(row.mensaje ?? row.message ?? ''),
  created_at: String(row.creado_en ?? row.created_at ?? ''),
});

/**
 * Obtiene los mensajes de una reserva ordenados cronológicamente.
 * Devuelve [] ante cualquier error para no romper el polling de la UI.
 */
export const fetchMessages = async (bookingId: string): Promise<ChatMessage[]> => {
  if (!bookingId) return [];
  try {
    const headers = await getSupabaseAuthHeaders();
    const url =
      `${SUPABASE_URL}/rest/v1/${CHAT_TABLE}` +
      `?id_reserva=eq.${encodeURIComponent(bookingId)}` +
      `&select=id,id_reserva,id_remitente,rol_remitente,remitente_nombre,mensaje,creado_en` +
      `&order=creado_en.asc`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { ...headers, Accept: 'application/json' },
    });
    if (!res.ok) {
      const text = await res.text();
      // 404/PGRST205: tabla aún no expuesta — no spamear LogBox rojo
      if (res.status === 404 || text.includes('PGRST205')) {
        console.warn('chatService.fetchMessages: tabla no disponible', res.status);
      } else {
        console.warn('chatService.fetchMessages error:', res.status, text);
      }
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(mapRow);
  } catch (error) {
    console.warn('chatService.fetchMessages exception:', error);
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
    const url = `${SUPABASE_URL}/rest/v1/${CHAT_TABLE}`;
    const payload = {
      id_reserva: bookingId,
      id_remitente: senderId || null,
      rol_remitente: toDbRole(senderRole),
      remitente_nombre: senderName || null,
      mensaje: message.trim(),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('chatService.sendMessage error:', res.status, text);
      return null;
    }

    const data = await res.json();
    const row = Array.isArray(data) ? data[0] : data;
    return row ? mapRow(row) : null;
  } catch (error) {
    console.warn('chatService.sendMessage exception:', error);
    return null;
  }
};

/** Marca el chat como leído para este booking + rol (al abrir OnlineChat). */
export const markChatRead = async (
  bookingId: string,
  role: ChatRole
): Promise<void> => {
  if (!bookingId) return;
  try {
    await AsyncStorage.setItem(lastReadKey(bookingId, role), new Date().toISOString());
  } catch (e) {
    console.warn('chatService.markChatRead error:', e);
  }
};

/**
 * Cuenta mensajes del otro rol posteriores al lastRead local.
 * Si la tabla no existe / falla fetch, retorna 0.
 */
export const countUnreadMessages = async (
  bookingId: string,
  myRole: ChatRole
): Promise<number> => {
  if (!bookingId) return 0;
  try {
    const [messages, raw] = await Promise.all([
      fetchMessages(bookingId),
      AsyncStorage.getItem(lastReadKey(bookingId, myRole)),
    ]);
    const lastReadMs = raw ? new Date(raw).getTime() : 0;
    return messages.filter(
      (m) =>
        m.sender_role !== myRole &&
        new Date(m.created_at).getTime() > lastReadMs
    ).length;
  } catch {
    return 0;
  }
};
