/**
 * Puente entre el hook de pasos de registro (que vive con el modal montado en
 * TabNavigator) y las pantallas que aceptan servicios, sin acoplarlas a React.
 * El hook publica el último resultado; las pantallas lo consultan de forma
 * síncrona y pueden pedir que el modal se abra.
 */

type Snapshot = { userType: string; pending: number; loaded: boolean };

let snapshot: Snapshot = { userType: '', pending: 0, loaded: false };
const requestListeners = new Set<() => void>();

export function setOnboardingSnapshot(next: Snapshot): void {
  snapshot = next;
  notifyState();
}

/** True solo para conductores con datos cargados y al menos un paso pendiente. */
export function isDriverRegistrationIncomplete(): boolean {
  return snapshot.loaded && snapshot.userType === 'driver' && snapshot.pending > 0;
}

/** Pide al modal que se abra ya (p. ej. al intentar aceptar un servicio). */
export function requestOnboardingModal(): void {
  requestListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

export function subscribeOnboardingRequests(fn: () => void): () => void {
  requestListeners.add(fn);
  return () => {
    requestListeners.delete(fn);
  };
}

export type AcceptGate = 'onboarding' | 'unverified' | 'allow';

/**
 * Decide qué pasa cuando un conductor intenta aceptar un servicio.
 * El registro incompleto va primero: abre el modal en lugar de cualquier
 * alerta. `approved === false` (lo marca el equipo) solo importa con el
 * registro completo. Nunca se usa `approved` para dar pasos por completados.
 */
export function evaluateAcceptGate(
  registrationIncomplete: boolean,
  approved: boolean | null | undefined,
): AcceptGate {
  if (registrationIncomplete) return 'onboarding';
  if (approved === false) return 'unverified';
  return 'allow';
}

/**
 * Otros avisos (p. ej. el recordatorio de membresía) deben esperar al modal de
 * registro: se consideran bloqueados mientras el modal está abierto, o mientras
 * un conductor con registro incompleto aún no sabe si el modal se abrirá solo.
 */
let modalOpen = false;
let autoOpenSettled = false;
const stateListeners = new Set<() => void>();

function notifyState(): void {
  stateListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

export function setOnboardingModalOpen(open: boolean): void {
  if (modalOpen === open) return;
  modalOpen = open;
  notifyState();
}

/** El modal ya decidió (abrir o no) con datos cargados. */
export function markOnboardingAutoOpenSettled(): void {
  if (autoOpenSettled) return;
  autoOpenSettled = true;
  notifyState();
}

/**
 * Tiempo máximo que otros avisos esperan al modal de registro. Pasado ese
 * plazo (consulta lenta, sin internet, error del servidor, o el modal nunca
 * decide) dejan de bloquearse; el modal, si está abierto, sigue mandando.
 */
export const ONBOARDING_MAX_WAIT_MS = 8000;

let waitExpired = false;
let waitTimer: ReturnType<typeof setTimeout> | null = null;

/** Arranca (una sola vez) el reloj de espera máxima. */
export function beginOnboardingWait(ms: number = ONBOARDING_MAX_WAIT_MS): void {
  if (waitExpired || waitTimer) return;
  waitTimer = setTimeout(() => {
    waitTimer = null;
    waitExpired = true;
    notifyState();
  }, ms);
}

/** Solo para tests: vuelve el gate a su estado inicial. */
export function __resetOnboardingGateForTests(): void {
  snapshot = { userType: '', pending: 0, loaded: false };
  modalOpen = false;
  autoOpenSettled = false;
  waitExpired = false;
  if (waitTimer) clearTimeout(waitTimer);
  waitTimer = null;
  requestListeners.clear();
  stateListeners.clear();
}

export function isOnboardingBlockingOtherAlerts(): boolean {
  if (modalOpen) return true;
  if (waitExpired) return false;
  // Sin datos cargados aún no se sabe si el modal hará falta: esperar.
  if (!snapshot.loaded) return true;
  return isDriverRegistrationIncomplete() && !autoOpenSettled;
}

export function subscribeOnboardingState(fn: () => void): () => void {
  stateListeners.add(fn);
  beginOnboardingWait();
  return () => {
    stateListeners.delete(fn);
  };
}
