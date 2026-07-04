import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Consentimiento del usuario para el uso de la ubicación en SEGUNDO PLANO.
 *
 * Google Play exige una "Prominent Disclosure": antes de solicitar el permiso
 * ACCESS_BACKGROUND_LOCATION, la app debe mostrar una pantalla propia que
 * explique qué datos recoge, que ocurre en segundo plano y para qué, con
 * botones de aceptación/rechazo explícitos. Aquí persistimos esa decisión.
 *
 * El consentimiento se guarda POR USUARIO (clave + id de auth) para que cada
 * conductor tome su propia decisión, incluso si comparten el mismo teléfono.
 */

const KEY_PREFIX = 'tmasplus_bg_location_consent_v1';

export type BackgroundLocationConsent = 'granted' | 'denied' | null;

function keyFor(userId?: string | null): string {
  return userId ? `${KEY_PREFIX}::${userId}` : KEY_PREFIX;
}

export async function getBackgroundLocationConsent(
  userId?: string | null,
): Promise<BackgroundLocationConsent> {
  try {
    const value = await AsyncStorage.getItem(keyFor(userId));
    if (value === 'granted' || value === 'denied') return value;
    return null;
  } catch (e) {
    console.warn('[bgLocationConsent] no se pudo leer el consentimiento:', e);
    return null;
  }
}

export async function setBackgroundLocationConsent(
  userId: string | null | undefined,
  value: 'granted' | 'denied',
): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(userId), value);
  } catch (e) {
    console.warn('[bgLocationConsent] no se pudo guardar el consentimiento:', e);
  }
}

export async function hasBackgroundLocationConsent(
  userId?: string | null,
): Promise<boolean> {
  return (await getBackgroundLocationConsent(userId)) === 'granted';
}

/**
 * Pub/sub para volver a mostrar la divulgación cuando el permiso se necesita
 * de verdad (un viaje activo) y el conductor aún no lo concedió — por ejemplo,
 * si antes tocó "Ahora no". Así no queda bloqueado para siempre.
 */
type DisclosureListener = () => void;
const disclosureListeners = new Set<DisclosureListener>();

export function subscribeDisclosureRequest(cb: DisclosureListener): () => void {
  disclosureListeners.add(cb);
  return () => {
    disclosureListeners.delete(cb);
  };
}

export function requestBackgroundLocationDisclosure(): void {
  disclosureListeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.warn('[bgLocationConsent] listener de divulgación falló:', e);
    }
  });
}
