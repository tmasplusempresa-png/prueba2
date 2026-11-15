/**
 * 401 (JWT vencido) en el envío de puntos de tracking: un refresh y un reintento;
 * si el refresh falla, el punto se encola sin perderse.
 */
const store: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
    setItem: jest.fn(async (k: string, v: string) => {
      store[k] = v;
    }),
    removeItem: jest.fn(async (k: string) => {
      delete store[k];
    }),
    multiSet: jest.fn(async (pairs: Array<[string, string]>) => {
      pairs.forEach(([k, v]) => {
        store[k] = v;
      });
    }),
  },
}));
jest.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  ActivityType: { AutomotiveNavigation: 2 },
}));
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn((_name: string, cb: any) => {
    (global as any).__taskCb = cb;
  }),
}));
jest.mock('@/common/services/backgroundLocationConsent', () => ({
  getBackgroundLocationConsent: jest.fn(),
  requestBackgroundLocationDisclosure: jest.fn(),
}));

const mockRefresh = jest.fn();
const mockSession = jest.fn();
jest.mock('@/config/SupabaseConfig', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  getSafeSession: (...a: any[]) => mockSession(...a),
  refreshAuthSession: (...a: any[]) => mockRefresh(...a),
}));

import { flushPendingTrackingPoints } from '../services/driverLocationTask';

const BOOKING = 'b1';
const DRIVER = 'd1';
const res = (status: number) => ({ ok: status >= 200 && status < 300, status, text: async () => '' });
const auth = (call: any[]) => (call[1].headers.Authorization as string);

function locationsPayload() {
  const now = Date.now();
  return {
    data: {
      locations: [
        { coords: { latitude: 4.65, longitude: -74.1, accuracy: 5, speed: 3, heading: 10 }, timestamp: now },
      ],
    },
    error: null,
  };
}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  store.driver_tracking_active_booking_id = BOOKING;
  store.driver_tracking_active_driver_id = DRIVER;
  mockRefresh.mockReset();
  mockSession.mockReset().mockResolvedValue({ access_token: 'viejo' });
  (global as any).fetch = jest.fn();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('insert normal de la task ante 401', () => {
  it('refresca una vez y reintenta con el token nuevo', async () => {
    mockRefresh.mockResolvedValue({ access_token: 'nuevo' });
    (global as any).fetch = jest.fn().mockResolvedValueOnce(res(401)).mockResolvedValueOnce(res(201));

    await (global as any).__taskCb(locationsPayload());

    const f = (global as any).fetch as jest.Mock;
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledTimes(2);
    expect(auth(f.mock.calls[0])).toBe('Bearer viejo');
    expect(auth(f.mock.calls[1])).toBe('Bearer nuevo');
    expect(store.driver_tracking_pending_b1).toBeUndefined(); // no se encola
    expect(store.driver_tracking_last_insert).toBeDefined(); // se registró como insertado
  });

  it('si el refresh falla, encola el punto sin perderlo', async () => {
    mockRefresh.mockResolvedValue(null);
    (global as any).fetch = jest.fn().mockResolvedValue(res(401));

    await (global as any).__taskCb(locationsPayload());

    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect((global as any).fetch).toHaveBeenCalledTimes(1); // sin reintento
    const queued = JSON.parse(store.driver_tracking_pending_b1);
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({ lat: 4.65, lng: -74.1 });
  });

  it('si el reintento con el token nuevo también falla, encola', async () => {
    mockRefresh.mockResolvedValue({ access_token: 'nuevo' });
    (global as any).fetch = jest.fn().mockResolvedValue(res(401));

    await (global as any).__taskCb(locationsPayload());

    expect((global as any).fetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(store.driver_tracking_pending_b1)).toHaveLength(1);
  });
});

describe('envío de la cola ante 401', () => {
  const seed = (n: number) =>
    (store.driver_tracking_pending_b1 = JSON.stringify(
      Array.from({ length: n }, (_, i) => ({ lat: 4 + i * 1e-4, lng: -74, speed: null, heading: null, ts: 1_700_000_000_000 + i })),
    ));

  it('un solo refresh por tanda, aunque haya varios lotes', async () => {
    seed(250); // 3 lotes de 100/100/50
    mockRefresh.mockResolvedValue({ access_token: 'nuevo' });
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce(res(401)) // lote 1 con token viejo
      .mockResolvedValue(res(201)); // reintento y lotes siguientes

    await flushPendingTrackingPoints(BOOKING, DRIVER, true);

    const f = (global as any).fetch as jest.Mock;
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledTimes(4); // 401 + reintento + lote 2 + lote 3
    expect(auth(f.mock.calls[1])).toBe('Bearer nuevo');
    expect(auth(f.mock.calls[2])).toBe('Bearer nuevo');
    expect(auth(f.mock.calls[3])).toBe('Bearer nuevo');
    expect(store.driver_tracking_pending_b1).toBeUndefined(); // todo confirmado
  });

  it('con refresh fallido no pierde nada: la cola queda intacta', async () => {
    seed(30);
    mockRefresh.mockResolvedValue(null);
    (global as any).fetch = jest.fn().mockResolvedValue(res(401));

    await flushPendingTrackingPoints(BOOKING, DRIVER, true);

    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(store.driver_tracking_pending_b1)).toHaveLength(30);
  });
});
