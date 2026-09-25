import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
/* import { SupabaseConfig } from './AppConfig'; */
// Ignora AppConfig dentro de la app, usa directamente los valores del manifest
import Constants from 'expo-constants';
const extra = Constants.expoConfig?.extra || {};

const SupabaseConfig = {
  url: extra.SUPABASE_URL as string,
  anonKey: extra.SUPABASE_ANON_KEY as string,
};

// Tipos generados del esquema CONSOLIDADO (aplicacioncore).
import { Database } from './database.new.types';

// ==================== INTERFACES TYPESCRIPT ====================
interface SupabaseClientOptions {
  auth: {
    storage: any;
    autoRefreshToken: boolean;
    persistSession: boolean;
    detectSessionInUrl: boolean;
    flowType?: 'pkce' | 'implicit';
    storageKey?: string;
  };
  global: {
    headers: Record<string, string>;
  };
  realtime: {
    params: {
      eventsPerSecond: number;
    };
  };
}

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  error?: string;
}

interface DatabaseHealth {
  tablesCount: number;
  activeConnections?: number;
  isHealthy: boolean;
}

const SESSION_STORAGE_KEY = 'tmasplus_auth_session';

const toErrorMessage = (error: any): string => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return String(error.message || error.error_description || error.name || '');
};

const isInvalidRefreshTokenError = (error: any): boolean => {
  const msg = toErrorMessage(error);
  if (!msg) return false;
  return msg.includes('Invalid Refresh Token') || msg.includes('Refresh Token Not Found');
};

const getProjectRefFromUrl = (url: string): string | null => {
  try {
    const host = new URL(url).hostname;
    const ref = host.split('.')[0];
    return ref || null;
  } catch {
    return null;
  }
};

const getJwtProjectRef = (jwt: string): string | null => {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    if (typeof payload?.ref === 'string') return payload.ref;
    const iss = typeof payload?.iss === 'string' ? payload.iss : '';
    const fromIss = iss.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
    return fromIss?.[1] || null;
  } catch {
    return null;
  }
};

const getJwtExp = (jwt: string): number | null => {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return typeof payload?.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
};

/**
 * GoTrue a veces deja `session.expires_at` desfasado (vimos expira_en≈-20962s
 * con JWT aún válido). La fuente de verdad es el claim `exp` del access_token.
 * Sin esto el auto-refresh cree que el token ya venció y refresca en bucle.
 */
const normalizeSessionExpires = <T extends { access_token?: string; expires_at?: number }>(
  session: T | null,
): T | null => {
  if (!session?.access_token) return session;
  const jwtExp = getJwtExp(session.access_token);
  if (!jwtExp) return session;
  if (session.expires_at === jwtExp) return session;
  return { ...session, expires_at: jwtExp };
};

const CURRENT_PROJECT_REF = getProjectRefFromUrl(SupabaseConfig.url || '');

// Caché en memoria actualizada por onAuthStateChange.
// Evita thunderstorms de getSession() (cada una puede disparar refresh
// concurrente → rotación de refresh_token → SIGNED_OUT espurio).
let _memorySession: Session | null = null;
const SESSION_CACHE_SKEW_SEC = 45;
let _loggedExpiresMismatch = false;

const setMemorySession = (session: Session | null) => {
  const normalized = normalizeSessionExpires(session);
  if (
    !_loggedExpiresMismatch &&
    session?.access_token &&
    typeof session.expires_at === 'number' &&
    normalized &&
    normalized.expires_at !== session.expires_at
  ) {
    _loggedExpiresMismatch = true;
    const now = Math.floor(Date.now() / 1000);
    console.warn(
      '[auth] expires_at desfasado vs JWT.exp — se corrige',
      `expires_at=${session.expires_at - now}s`,
      `jwt.exp=${(normalized.expires_at as number) - now}s`,
    );
  }
  _memorySession = normalized;
};

/** Sesión en memoria si el access_token aún tiene margen; no llama a getSession. */
export const getMemorySession = (): Session | null => {
  const s = _memorySession;
  if (!s?.access_token) return null;
  const exp = getJwtExp(s.access_token) ?? s.expires_at;
  if (typeof exp === 'number') {
    const now = Math.floor(Date.now() / 1000);
    if (exp - now <= SESSION_CACHE_SKEW_SEC) return null;
  }
  return s;
};

// Storage envuelto: descarta solo sesiones de OTRO proyecto o caducadas >14 días.
// Nunca borra por JSON parse flaky (escritura concurrente del SDK).
// IMPORTANTE: devolver null desde getItem con key de sesión hace que GoTrue
// emita SIGNED_OUT — por eso logueamos cada null "activo".
const REFRESH_GRACE_SECONDS = 14 * 24 * 60 * 60;
const sessionStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) {
        if (key === SESSION_STORAGE_KEY) {
          // Normal al arranque sin login; no spamear.
        }
        return null;
      }
      if (key !== SESSION_STORAGE_KEY) return value;

      let parsed: any;
      try {
        parsed = JSON.parse(value);
      } catch {
        // No devolver null: eso dispara SIGNED_OUT. Dejar el valor crudo.
        console.warn('[SupabaseStorage] JSON ilegible — se devuelve crudo (sin borrar)');
        return value;
      }

      const accessToken: string | undefined = parsed?.access_token;
      if (accessToken && CURRENT_PROJECT_REF) {
        const tokenRef = getJwtProjectRef(accessToken);
        if (tokenRef && tokenRef !== CURRENT_PROJECT_REF) {
          console.warn(
            '[SupabaseStorage] getItem→null: otro proyecto (' + tokenRef + ' ≠ ' + CURRENT_PROJECT_REF + ')',
          );
          await AsyncStorage.removeItem(key);
          return null;
        }
      }

      // Preferir JWT.exp para decidir caducidad real (expires_at a veces miente).
      const jwtExp = accessToken ? getJwtExp(accessToken) : null;
      const expiresAt: number | undefined =
        typeof jwtExp === 'number' ? jwtExp : parsed?.expires_at;
      if (typeof expiresAt === 'number') {
        const nowSec = Math.floor(Date.now() / 1000);
        if (nowSec - expiresAt > REFRESH_GRACE_SECONDS) {
          console.warn('[SupabaseStorage] getItem→null: sesión caducada >14d');
          await AsyncStorage.removeItem(key);
          return null;
        }
      }

      // Devolver sesión con expires_at alineado al JWT para que autoRefresh no
      // entre en bucle pensando que el token ya venció.
      if (typeof jwtExp === 'number' && parsed.expires_at !== jwtExp) {
        const fixed = { ...parsed, expires_at: jwtExp };
        const fixedStr = JSON.stringify(fixed);
        // Write-back sin await: no bloquear el getItem del SDK.
        AsyncStorage.setItem(key, fixedStr).catch(() => {});
        return fixedStr;
      }

      return value;
    } catch (err) {
      console.warn('[SupabaseStorage] getItem exception (devuelve null):', (err as any)?.message);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (key !== SESSION_STORAGE_KEY) {
      return AsyncStorage.setItem(key, value);
    }
    try {
      const parsed = JSON.parse(value);
      const normalized = normalizeSessionExpires(parsed);
      return AsyncStorage.setItem(key, JSON.stringify(normalized ?? parsed));
    } catch {
      return AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (key === SESSION_STORAGE_KEY) {
      console.warn('[SupabaseStorage] removeItem sesión', new Error().stack?.split('\n').slice(1, 4).join(' | '));
    }
    return AsyncStorage.removeItem(key);
  },
};

// ==================== CONFIGURACION OPTIMIZADA DEL CLIENTE ====================
const createSupabaseClientOptions = (): SupabaseClientOptions => ({
  auth: {
    storage: sessionStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Especifico para React Native
    // PKCE: el enlace de recuperación llega como ?code=... (query) en vez de
    // #access_token=... (fragmento). En Android el fragmento se pierde al saltar
    // del navegador al deep link; el query sobrevive. La app intercambia el code
    // por la sesión con exchangeCodeForSession (ver ResetPassword.tsx).
    flowType: 'pkce',
    storageKey: SESSION_STORAGE_KEY,
  },
  global: {
    headers: {
      'X-Client-Info': `TmasPlus-mobile@${process.env.APP_VERSION || '1.10.3'}`,
      'X-App-Platform': 'react-native',
      'X-App-Environment': process.env.NODE_ENV || 'development',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

console.log('Supabase URL efectiva:', SupabaseConfig.url);


// ==================== CLIENTE PRINCIPAL SUPABASE TIPADO ====================
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SupabaseConfig.url,
  SupabaseConfig.anonKey,
  createSupabaseClientOptions()
); 

// ==================== FLAG DE RECUPERACION DE CONTRASEÑA ====================
// Mientras el usuario restablece su contraseña por deep link, exchangeCodeForSession
// crea una sesión temporal que dispara SIGNED_IN. Sin este flag, el listener global
// marcaría al usuario como autenticado y el navegador conmutaría de stack,
// desmontando la pantalla ResetPassword (inputs quedaban inutilizables).
let _passwordRecoveryInProgress = false;
export const setPasswordRecoveryInProgress = (value: boolean): void => {
  _passwordRecoveryInProgress = value;
};
export const isPasswordRecoveryInProgress = (): boolean => _passwordRecoveryInProgress;

// ==================== REST API CREDENTIALS (for direct fetch calls) ====================
export const SUPABASE_URL = SupabaseConfig.url;
export const SUPABASE_ANON_KEY = SupabaseConfig.anonKey;

let _clearSessionInFlight: Promise<void> | null = null;
let _lastClearedAt = 0;

export const clearStoredSession = async (reason = 'explicit'): Promise<void> => {
  // Evita storms: muchos getSession en paralelo + refresh token rotation
  // pueden disparar "Invalid Refresh Token" falso y borrar una sesión buena.
  if (_clearSessionInFlight) return _clearSessionInFlight;
  const now = Date.now();
  if (now - _lastClearedAt < 3000) return;

  console.warn('[clearStoredSession] razón:', reason);

  _clearSessionInFlight = (async () => {
    try {
      setMemorySession(null);
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('Error clearing stored auth session:', error);
    }

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('Error clearing Supabase auth state:', error);
    } finally {
      _lastClearedAt = Date.now();
      _clearSessionInFlight = null;
    }
  })();

  return _clearSessionInFlight;
};

export const getSafeSession = async (): Promise<Session | null> => {
  try {
    const cached = getMemorySession();
    if (cached) return cached;

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      // No borrar sesión aquí: un refresh concurrente puede reportar
      // Invalid Refresh Token de forma espuria. El SDK emite SIGNED_OUT solo
      // cuando la sesión realmente murió.
      console.warn('[getSafeSession] error (sin clear):', error.message);
      return _memorySession;
    }

    const normalized = normalizeSessionExpires(session);
    if (normalized) setMemorySession(normalized);
    return normalized;
  } catch (error) {
    console.warn('Error inesperado obteniendo sesion segura:', error);
    return _memorySession;
  }
};

/**
 * Build auth headers for direct Supabase REST API calls.
 * Valida el JWT por claim `exp` (como antes del pull de reconexión), no por
 * session.expires_at que a veces viene desfasado.
 */
export const getSupabaseAuthHeaders = async (includeContentType = false) => {
  let token = SUPABASE_ANON_KEY;
  try {
    const cached = getMemorySession();
    const jwt = cached?.access_token;
    if (jwt && jwt.length > 40) {
      const exp = getJwtExp(jwt);
      if (!exp || exp * 1000 > Date.now()) {
        token = jwt;
      }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      const normalized = normalizeSessionExpires(session);
      if (normalized?.access_token) {
        setMemorySession(normalized);
        const exp = getJwtExp(normalized.access_token);
        if (!exp || exp * 1000 > Date.now()) {
          token = normalized.access_token;
        }
      }
    }
  } catch {}
  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
  };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

/** true si el Bearer es un JWT de usuario (no la anon key). */
export const hasUserAuthHeader = (headers: Record<string, string>): boolean => {
  const auth = headers.Authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return Boolean(token && token !== SUPABASE_ANON_KEY && token.length > 40);
};

// ==================== FUNCIONES DE AUTENTICACION MEJORADAS ====================
export const Auth = {
  /**
   * Obtiene el usuario actual con manejo robusto de errores
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      // Preferir sesión local/caché: getUser() pega a red y, en refresh concurrente,
      // puede fallar y antes disparaba clearStoredSession → SIGNED_OUT espurio.
      const session = await getSafeSession();
      if (session?.user) return session.user;

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('[getCurrentUser] getUser error (sin clear):', error.message);
        return null;
      }
      return user;
    } catch (error) {
      console.warn('Error inesperado obteniendo usuario:', error);
      return null;
    }
  },

  /**
   * Obtiene la sesion actual con validacion
   */
  getCurrentSession: async (): Promise<Session | null> => {
    return getSafeSession();
  },

  /**
   * Verifica si el usuario esta autenticado y la sesion es valida
   */
  isAuthenticated: async (): Promise<boolean> => {
    const session = await Auth.getCurrentSession();
    if (!session?.user) return false;
    
    // Verificar que la sesion no haya expirado
    const expiresAt = new Date(session.expires_at! * 1000);
    return expiresAt > new Date();
  },

  /**
   * Obtiene el perfil completo del usuario desde la tabla users
   */
  getUserProfile: async (): Promise<Database['public']['Tables']['persona']['Row'] | null> => {
    try {
      const session = (await getSafeSession()) || _memorySession;
      if (!session?.access_token || !session.user) return null;

      // 1) RPC consolidado (suele ser SECURITY DEFINER) — evita GRANT de anon en persona
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_perfil_movil' as any);
        if (!rpcError && rpcData) {
          return rpcData as any;
        }
      } catch {
        // RPC no disponible — fallback
      }

      // 2) Vista users (requiere JWT authenticated; no llamar como anon)
      const { data, error } = await supabase
        .from('users' as any)
        .select('*')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error obteniendo perfil de usuario:', error.message);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Error inesperado obteniendo perfil:', error);
      return null;
    }
  },

  /**
   * Cierra la sesion del usuario de forma segura
   */
  signOut: async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error cerrando sesion:', error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error inesperado cerrando sesion:', error);
      return false;
    }
  }
} as const;

// ==================== FUNCIONES DE CONEXION Y SALUD MEJORADAS ====================
export const Health = {
  /**
   * Prueba la conexion a Supabase con verificacion completa
   */
  testConnection: async (): Promise<ConnectionStatus> => {
    const status: ConnectionStatus = {
      isConnected: false,
      lastChecked: new Date()
    };

    try {
      // Test 1: Verificar conexion basica.
      // Se consulta un catálogo público (categoria_vehiculo) legible por anon.
      // IMPORTANTE: con RLS, un error de permiso/JWT igual significa que el
      // servidor RESPONDIÓ (está accesible). Solo un fallo de red (throw →
      // catch de abajo) cuenta como desconexión. Así, no estar logueado no
      // marca "FALLIDO".
      const { error: pingError } = await supabase
        .from('categoria_vehiculo')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      if (pingError) {
        // El servidor contestó aunque restrinja filas por RLS → sigue conectado.
        console.warn('[testConnection] ping restringido (server accesible):', pingError.message || (pingError as any).code || pingError);
      }

      // Test 2: Verificar autenticacion funciona
      const { error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        if (isInvalidRefreshTokenError(authError)) {
          // No borrar sesión desde el ping de salud — solo reportar.
          console.warn('[testConnection] refresh token inválido (sin clear):', authError.message);
          status.isConnected = true;
          return status;
        }
        status.error = `Autenticacion falló: ${authError.message}`;
        return status;
      }

      status.isConnected = true;
    } catch (error) {
      status.error = `Error de conexion: ${error}`;
    }

    return status;
  },

  /**
   * Verifica la salud de la base de datos T+Plus
   */
  checkDatabaseHealth: async (): Promise<DatabaseHealth> => {
    const health: DatabaseHealth = {
      tablesCount: 0,
      isHealthy: false
    };

    try {
      // Sin JWT: solo catálogo público. Con JWT: vistas/tablas de negocio.
      // Nunca pingear `persona`/`users` como anon (vista users → persona → 42501).
      const { data: { session } } = await supabase.auth.getSession();
      const tablesToCheck = session?.access_token
        ? ['users', 'vehiculo', 'reserva', 'categoria_vehiculo']
        : ['categoria_vehiculo'];
      let successCount = 0;

      for (const table of tablesToCheck) {
        try {
          const { error } = await supabase
            .from(table as any)
            .select('id', { count: 'exact', head: true })
            .limit(1);

          if (!error) {
            successCount++;
            continue;
          }
          const code = String((error as any)?.code || '');
          const msg = String(error.message || '');
          const existsButRestricted =
            code === '42501' ||
            code === 'PGRST301' ||
            msg.toLowerCase().includes('permission') ||
            msg.toLowerCase().includes('row-level security') ||
            msg.toLowerCase().includes('rls');
          const missing =
            code === 'PGRST205' ||
            msg.toLowerCase().includes('does not exist') ||
            msg.toLowerCase().includes('schema cache');

          if (existsButRestricted) {
            // Tabla/vista existe; RLS o GRANT bloquean — no es fallo de schema.
            successCount++;
          } else if (missing) {
            console.warn(`[checkDatabaseHealth] tabla ausente: ${table}`, code || msg);
          } else {
            // Otros errores (p.ej. columna) — la relación existe
            successCount++;
            console.warn(`[checkDatabaseHealth] ${table}:`, code || msg);
          }
        } catch {
          // Red / throw inesperado
        }
      }

      health.tablesCount = successCount;
      health.isHealthy = successCount === tablesToCheck.length;

    } catch (error) {
      console.error('Error verificando salud de BD:', error);
    }

    return health;
  },

  /**
   * Verifica el estado completo de la configuracion
   */
  validateConfig: (): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones criticas
    if (!SupabaseConfig.url) {
      errors.push('SUPABASE_URL no configurada');
    } else if (!SupabaseConfig.url.includes('supabase.co')) {
      errors.push('SUPABASE_URL no parece ser una URL valida de Supabase');
    }

    if (!SupabaseConfig.anonKey) {
      errors.push('SUPABASE_ANON_KEY no configurada');
    } else if (!SupabaseConfig.anonKey.startsWith('sb_publishable_') && SupabaseConfig.anonKey.length < 100) {
      // Las nuevas publishable keys (sb_publishable_...) son cortas y válidas; solo
      // advertir si NO es una de ellas y además parece un JWT truncado.
      warnings.push('SUPABASE_ANON_KEY parece ser muy corta');
    }

    // Validaciones de seguridad
    if (process.env.NODE_ENV === 'production') {
      if (SupabaseConfig.url.includes('localhost')) {
        errors.push('URL de Supabase apunta a localhost en produccion');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
} as const;

// ==================== UTILIDADES DE DESARROLLO MEJORADAS ====================
export const DevUtils = {
  /**
   * Log completo de informacion de conexion en desarrollo
   */
  logConnectionInfo: async (): Promise<void> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== SUPABASE CONNECTION INFO ===');
      console.log('URL:', SupabaseConfig.url);
      console.log('Project ID:', SupabaseConfig.url.split('//')[1]?.split('.')[0]);
      console.log('Environment:', process.env.NODE_ENV);
      
      // Validacion de configuracion
      const configValidation = Health.validateConfig();
      console.log('Config Valid:', configValidation.isValid ? 'SI' : 'NO');
      
      if (!configValidation.isValid) {
        console.error('Config Errors:', configValidation.errors);
      }
      
      if (configValidation.warnings.length > 0) {
        console.warn('Config Warnings:', configValidation.warnings);
      }

      // Test de conexion
      try {
        const connectionStatus = await Health.testConnection();
        console.log('Connection Status:', connectionStatus.isConnected ? 'CONECTADO' : 'FALLIDO');
        
        if (!connectionStatus.isConnected && connectionStatus.error) {
          console.error('Connection Error:', connectionStatus.error);
        }

        // Test de salud de BD
        if (connectionStatus.isConnected) {
          const dbHealth = await Health.checkDatabaseHealth();
          console.log('Database Health:', dbHealth.isHealthy ? 'SALUDABLE' : 'CON PROBLEMAS');
          console.log('Tables Available:', `${dbHealth.tablesCount} ok`);
        }
      } catch (error) {
        console.error('Connection Test Failed:', error);
      }
      
      console.log('=== END CONNECTION INFO ===');
    }
  },

  /**
   * Ejecuta diagnosticos completos del sistema
   */
  runDiagnostics: async (): Promise<{
    config: boolean;
    connection: boolean;
    database: boolean;
    auth: boolean;
  }> => {
    const diagnostics = {
      config: false,
      connection: false,
      database: false,
      auth: false
    };

    try {
      // Test 1: Configuracion
      const configTest = Health.validateConfig();
      diagnostics.config = configTest.isValid;

      // Test 2: Conexion
      const connectionTest = await Health.testConnection();
      diagnostics.connection = connectionTest.isConnected;

      if (diagnostics.connection) {
        // Test 3: Base de datos
        const dbTest = await Health.checkDatabaseHealth();
        diagnostics.database = dbTest.isHealthy;

        // Test 4: Autenticacion
        try {
          await supabase.auth.getSession();
          diagnostics.auth = true;
        } catch {
          diagnostics.auth = false;
        }
      }

    } catch (error) {
      console.error('Error ejecutando diagnosticos:', error);
    }

    return diagnostics;
  }
} as const;

// ==================== LISTENERS DE AUTENTICACION MEJORADOS ====================
let _lastTokenRefreshLogAt = 0;
const TOKEN_REFRESH_LOG_COOLDOWN_MS = 60_000;

export const setupAuthListeners = (): { unsubscribe: () => void } => {
  // Callback síncrono: cualquier await aquí bloquea el lock interno de GoTrue.
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    // Mantener caché sincronizada (también en TOKEN_REFRESHED).
    setMemorySession(session ?? null);

    if (process.env.NODE_ENV === 'development') {
      if (event === 'TOKEN_REFRESHED') {
        const now = Date.now();
        if (now - _lastTokenRefreshLogAt >= TOKEN_REFRESH_LOG_COOLDOWN_MS) {
          _lastTokenRefreshLogAt = now;
          const nowSec = Math.floor(now / 1000);
          const rawExp =
            typeof session?.expires_at === 'number' ? session.expires_at - nowSec : null;
          const jwtExp = session?.access_token ? getJwtExp(session.access_token) : null;
          const jwtLeft = typeof jwtExp === 'number' ? jwtExp - nowSec : '?';
          console.log(
            '[auth:setupListeners]',
            event,
            session?.user?.id || 'No user',
            `expires_at=${rawExp}s`,
            `jwt.exp=${jwtLeft}s`,
          );
        }
      } else {
        console.log('[auth:setupListeners]', event, session?.user?.id || 'No user');
      }
    }

    switch (event) {
      case 'SIGNED_IN':
        console.log('Usuario autenticado:', session?.user?.email);
        // Perfil lo carga app/_layout (loadProfile). No getSession aquí.
        break;

      case 'SIGNED_OUT':
        console.log('Usuario cerro sesion (o refresh token inválido)');
        // El SDK ya llamó storage.removeItem; no borrar de nuevo aquí.
        setMemorySession(null);
        break;

      case 'TOKEN_REFRESHED':
        break;

      case 'USER_UPDATED':
        console.log('Usuario actualizado');
        break;

      case 'PASSWORD_RECOVERY':
        console.log('Recuperacion de contraseña iniciada');
        break;
    }
  });

  return {
    unsubscribe: () => subscription.unsubscribe()
  };
};

// ==================== REALTIME PARA T+PLUS ====================
export const Realtime = {
  /**
   * Suscribirse a cambios de reservas en tiempo real
   */
  subscribeToBookings: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('reserva-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reserva',
          filter: `id_cliente=eq.${userId}`
        },
        callback
      )
      .subscribe();
  },

  /**
   * Suscribirse a tracking de viajes en tiempo real
   */
  subscribeToTracking: (bookingId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`reserva_tracking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reserva_tracking',
          filter: `id_reserva=eq.${bookingId}`
        },
        callback
      )
      .subscribe();
  },

  /**
   * Suscribirse a notificaciones en tiempo real
   */
  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('notificacion-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacion',
          filter: `id_persona=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
} as const;

// ==================== INICIALIZACION AUTOMATICA ====================
// Los listeners de auth deben quedar SIEMPRE registrados (también en release),
// si no, cuando el SDK detecta un refresh token inválido nadie limpia el storage
// y el error se repite en cada arranque.
setupAuthListeners();

if (process.env.NODE_ENV === 'development') {
  DevUtils.logConnectionInfo();
}

// ==================== EXPORTACIONES PRINCIPALES ====================
export default supabase;


console.log('Supabase URL efectiva:', SupabaseConfig.url);

/*
export {
  supabase as client,
  Auth,
  Health,
  DevUtils,
  Realtime,
  setupAuthListeners
};
*/
export type {
  SupabaseClient,
  Session,
  User,
  ConnectionStatus,
  DatabaseHealth
};