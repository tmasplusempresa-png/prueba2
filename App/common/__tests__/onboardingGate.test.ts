import {
  evaluateAcceptGate,
  isDriverRegistrationIncomplete,
  requestOnboardingModal,
  setOnboardingSnapshot,
  subscribeOnboardingRequests,
} from '@/common/services/onboardingGate';

describe('evaluateAcceptGate', () => {
  it('con pasos pendientes bloquea y pide el modal (aunque approved sea true o false)', () => {
    expect(evaluateAcceptGate(true, true)).toBe('onboarding');
    expect(evaluateAcceptGate(true, false)).toBe('onboarding');
    expect(evaluateAcceptGate(true, undefined)).toBe('onboarding');
  });

  it('registro completo y approved false: alerta de cuenta no verificada', () => {
    expect(evaluateAcceptGate(false, false)).toBe('unverified');
  });

  it('registro completo y approved true (o sin dato): deja pasar', () => {
    expect(evaluateAcceptGate(false, true)).toBe('allow');
    expect(evaluateAcceptGate(false, null)).toBe('allow');
    expect(evaluateAcceptGate(false, undefined)).toBe('allow');
  });
});

describe('isDriverRegistrationIncomplete / requestOnboardingModal', () => {
  it('solo es true para conductor con datos cargados y pendientes', () => {
    setOnboardingSnapshot({ userType: 'driver', pending: 2, loaded: true });
    expect(isDriverRegistrationIncomplete()).toBe(true);
    setOnboardingSnapshot({ userType: 'driver', pending: 0, loaded: true });
    expect(isDriverRegistrationIncomplete()).toBe(false);
    setOnboardingSnapshot({ userType: 'driver', pending: 2, loaded: false });
    expect(isDriverRegistrationIncomplete()).toBe(false);
    setOnboardingSnapshot({ userType: 'customer', pending: 2, loaded: true });
    expect(isDriverRegistrationIncomplete()).toBe(false);
  });

  it('el flujo de aceptar abre el modal solo cuando el gate dice onboarding', () => {
    const open = jest.fn();
    const unsubscribe = subscribeOnboardingRequests(open);

    setOnboardingSnapshot({ userType: 'driver', pending: 3, loaded: true });
    if (evaluateAcceptGate(isDriverRegistrationIncomplete(), true) === 'onboarding') requestOnboardingModal();
    expect(open).toHaveBeenCalledTimes(1);

    setOnboardingSnapshot({ userType: 'driver', pending: 0, loaded: true });
    if (evaluateAcceptGate(isDriverRegistrationIncomplete(), false) === 'onboarding') requestOnboardingModal();
    expect(open).toHaveBeenCalledTimes(1);

    unsubscribe();
    requestOnboardingModal();
    expect(open).toHaveBeenCalledTimes(1);
  });
});

describe('espera máxima de otros avisos', () => {
  const gate = require('../services/onboardingGate');

  beforeEach(() => {
    jest.useFakeTimers();
    gate.__resetOnboardingGateForTests();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('bloquea mientras no hay datos y deja de bloquear a los 8 s (consulta que nunca responde)', () => {
    const seen: boolean[] = [];
    gate.subscribeOnboardingState(() => seen.push(gate.isOnboardingBlockingOtherAlerts()));
    expect(gate.isOnboardingBlockingOtherAlerts()).toBe(true);

    jest.advanceTimersByTime(gate.ONBOARDING_MAX_WAIT_MS - 1);
    expect(gate.isOnboardingBlockingOtherAlerts()).toBe(true);

    jest.advanceTimersByTime(1);
    expect(gate.isOnboardingBlockingOtherAlerts()).toBe(false);
    expect(seen[seen.length - 1]).toBe(false); // los suscriptores se enteran
  });

  it('también se libera si hay datos con pasos pendientes pero el modal nunca decide', () => {
    gate.setOnboardingSnapshot({ userType: 'driver', pending: 3, loaded: true });
    gate.subscribeOnboardingState(() => {});
    expect(gate.isOnboardingBlockingOtherAlerts()).toBe(true);
    jest.advanceTimersByTime(gate.ONBOARDING_MAX_WAIT_MS);
    expect(gate.isOnboardingBlockingOtherAlerts()).toBe(false);
  });

  it('el modal abierto sigue bloqueando aunque haya vencido el plazo', () => {
    gate.subscribeOnboardingState(() => {});
    jest.advanceTimersByTime(gate.ONBOARDING_MAX_WAIT_MS);
    gate.setOnboardingModalOpen(true);
    expect(gate.isOnboardingBlockingOtherAlerts()).toBe(true);
    gate.setOnboardingModalOpen(false);
    expect(gate.isOnboardingBlockingOtherAlerts()).toBe(false);
  });

  it('con datos cargados y registro completo no bloquea ni espera', () => {
    gate.setOnboardingSnapshot({ userType: 'driver', pending: 0, loaded: true });
    expect(gate.isOnboardingBlockingOtherAlerts()).toBe(false);
  });
});
