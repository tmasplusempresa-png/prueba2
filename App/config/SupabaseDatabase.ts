import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './SupabaseConfig';
import { 
  Database, 
  UserRow, UserInsert, UserUpdate,
  CarRow, CarInsert, CarUpdate,
  BookingRow, BookingInsert, BookingUpdate,
  CarTypeRow, CarTypeInsert, CarTypeUpdate,
  TrackingRow, TrackingInsert,
  WalletHistoryRow, WalletHistoryInsert,
  NotificationRow, NotificationInsert,
  UserRatingRow, UserRatingInsert,
  SavedAddressRow, SavedAddressInsert,
  PromoRow,
  UserType, BookingStatus, PaymentMode, WalletTransactionType,
  LocationData
} from './database.types';

// ==================== INTERFACES PARA OPERACIONES ====================
interface DatabaseResult<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
  count?: number;
}

interface QueryOptions {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
}

interface FilterCondition {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is' | 'not';
  value: any;
}

interface PaginationResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
}

// ==================== CONFIGURACION Y CONSTANTES ====================
const DB_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 10000,
  defaultPageSize: 20,
  maxPageSize: 100
} as const;

const DB_ERRORS = {
  CONNECTION_ERROR: 'Error de conexion a la base de datos',
  UNAUTHORIZED: 'No autorizado para realizar esta operacion',
  NOT_FOUND: 'Registro no encontrado',
  VALIDATION_ERROR: 'Error de validacion de datos',
  CONSTRAINT_VIOLATION: 'Violacion de restriccion de base de datos',
  DUPLICATE_KEY: 'Ya existe un registro con estos datos',
  FOREIGN_KEY_VIOLATION: 'Referencia invalida a otro registro',
  UNKNOWN_ERROR: 'Error desconocido de base de datos'
} as const;

// ==================== UTILIDADES DE BASE DE DATOS ====================
const DatabaseUtils = {
  /**
   * Maneja errores especificos de PostgreSQL con contexto T+Plus
   */
  handlePostgresError: (error: PostgrestError, context?: string): string => {
    console.error('Database Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      context
    });

    switch (error.code) {
      case 'PGRST301':
        return DB_ERRORS.UNAUTHORIZED;
      case 'PGRST116':
        return DB_ERRORS.NOT_FOUND;
      case '23505':
        return DB_ERRORS.DUPLICATE_KEY;
      case '23503':
        return DB_ERRORS.FOREIGN_KEY_VIOLATION;
      case '23502':
        return DB_ERRORS.VALIDATION_ERROR;
      case '42703':
        return `Campo no encontrado: ${error.message}`;
      case '42P01':
        return `Tabla no encontrada: ${error.message}`;
      default:
        return error.message || DB_ERRORS.UNKNOWN_ERROR;
    }
  },

  /**
   * Aplica filtros de manera type-safe
   */
  applyFilters: (query: any, filters: FilterCondition[]): any => {
    return filters.reduce((q, filter) => {
      switch (filter.operator) {
        case 'eq':
          return q.eq(filter.column, filter.value);
        case 'neq':
          return q.neq(filter.column, filter.value);
        case 'gt':
          return q.gt(filter.column, filter.value);
        case 'gte':
          return q.gte(filter.column, filter.value);
        case 'lt':
          return q.lt(filter.column, filter.value);
        case 'lte':
          return q.lte(filter.column, filter.value);
        case 'like':
          return q.like(filter.column, filter.value);
        case 'ilike':
          return q.ilike(filter.column, filter.value);
        case 'in':
          return q.in(filter.column, filter.value);
        case 'is':
          return q.is(filter.column, filter.value);
        case 'not':
          return q.not(filter.column, 'eq', filter.value);
        default:
          return q;
      }
    }, query);
  },

  /**
   * Aplica opciones de consulta con validacion
   */
  applyQueryOptions: (query: any, options: QueryOptions): any => {
    let modifiedQuery = query;

    if (options.select) {
      modifiedQuery = modifiedQuery.select(options.select);
    }

    if (options.orderBy) {
      modifiedQuery = modifiedQuery.order(options.orderBy, { 
        ascending: options.ascending !== false 
      });
    }

    if (options.limit) {
      const limit = Math.min(options.limit, DB_CONFIG.maxPageSize);
      modifiedQuery = modifiedQuery.limit(limit);
    }

    if (options.offset) {
      modifiedQuery = modifiedQuery.range(
        options.offset, 
        options.offset + (options.limit || DB_CONFIG.defaultPageSize) - 1
      );
    }

    return modifiedQuery;
  },

  /**
   * Implementa retry inteligente con backoff exponencial
   */
  withRetry: async <T>(
    operation: () => Promise<T>,
    attempts: number = DB_CONFIG.retryAttempts,
    baseDelay: number = DB_CONFIG.retryDelay
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error: any) {
      if (attempts > 1 && DatabaseUtils.isRetryableError(error)) {
        const delay = baseDelay * (DB_CONFIG.retryAttempts - attempts + 1);
        console.log(`Reintentando operacion... Intentos restantes: ${attempts - 1}, delay: ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return DatabaseUtils.withRetry(operation, attempts - 1, baseDelay);
      }
      throw error;
    }
  },

  /**
   * Determina si un error es recuperable
   */
  isRetryableError: (error: any): boolean => {
    const retryableCodes = ['PGRST504', 'PGRST503', 'ECONNRESET', 'ETIMEDOUT'];
    return retryableCodes.includes(error.code) || 
           error.message?.includes('timeout') ||
           error.message?.includes('connection');
  },

  /**
   * Calcula paginacion
   */
  calculatePagination: (count: number, page: number, pageSize: number): PaginationResult<any> => {
    const totalPages = Math.ceil(count / pageSize);
    const hasMore = page < totalPages;
    
    return {
      data: [], // Se llena despues
      count,
      hasMore,
      currentPage: page,
      totalPages
    };
  }
} as const;

// ==================== SERVICIO PRINCIPAL DE BASE DE DATOS ====================
export const SupabaseDatabase = {
  /**
   * Selecciona registros con tipado completo
   */
  select: async <T = any>(
    table: string,
    options: QueryOptions = {},
    filters: FilterCondition[] = []
  ): Promise<DatabaseResult<T[]>> => {
    try {
      return await DatabaseUtils.withRetry(async () => {
        let query = supabase.from(table);
        
        // Aplicar filtros
        query = DatabaseUtils.applyFilters(query, filters);
        
        // Aplicar opciones de consulta
        query = DatabaseUtils.applyQueryOptions(query, options);

        const result = await query;
        const { data, error, count } = result as any;

        if (error) {
          return {
            data: null,
            error: DatabaseUtils.handlePostgresError(error, `select from ${table}`),
            success: false
          };
        }

        return {
          data: data as T[],
          error: null,
          success: true,
          count: count || undefined
        };
      });
    } catch (error) {
      console.error(`Error en select de ${table}:`, error);
      return {
        data: null,
        error: DB_ERRORS.CONNECTION_ERROR,
        success: false
      };
    }
  },

  /**
   * Selecciona con paginacion avanzada
   */
  selectWithPagination: async <T = any>(
    table: string,
    page: number = 1,
    pageSize: number = DB_CONFIG.defaultPageSize,
    options: QueryOptions = {},
    filters: FilterCondition[] = []
  ): Promise<DatabaseResult<PaginationResult<T>>> => {
    try {
      const offset = (page - 1) * pageSize;
      const paginatedOptions: QueryOptions = {
        ...options,
        limit: pageSize,
        offset
      };

      // Obtener datos y conteo total
      const [dataResult, countResult] = await Promise.all([
        SupabaseDatabase.select<T>(table, paginatedOptions, filters),
        SupabaseDatabase.count(table, filters)
      ]);

      if (!dataResult.success) {
        return {
          data: null,
          error: dataResult.error,
          success: false
        };
      }

      if (!countResult.success) {
        return {
          data: null,
          error: countResult.error,
          success: false
        };
      }

      const pagination = DatabaseUtils.calculatePagination(
        countResult.data || 0, 
        page, 
        pageSize
      );
      
      pagination.data = dataResult.data || [];

      return {
        data: pagination,
        error: null,
        success: true
      };
    } catch (error) {
      console.error(`Error en selectWithPagination de ${table}:`, error);
      return {
        data: null,
        error: DB_ERRORS.CONNECTION_ERROR,
        success: false
      };
    }
  },

  /**
   * Selecciona un registro por ID con tipado
   */
  selectById: async <T = any>(
    table: string,
    id: string,
    options: Pick<QueryOptions, 'select'> = {}
  ): Promise<DatabaseResult<T>> => {
    try {
      return await DatabaseUtils.withRetry(async () => {
        const result = await supabase
          .from(table)
          .select(options.select || '*')
          .eq('id', id)
          .single();
        const { data, error } = result as any;

        if (error) {
          return {
            data: null,
            error: DatabaseUtils.handlePostgresError(error, `selectById ${table}/${id}`),
            success: false
          };
        }

        return {
          data: data as T,
          error: null,
          success: true
        };
      });
    } catch (error) {
      console.error(`Error en selectById de ${table}:`, error);
      return {
        data: null,
        error: DB_ERRORS.CONNECTION_ERROR,
        success: false
      };
    }
  },

  /**
   * Inserta registros con tipado estricto
   */
  insert: async <T = any>(
    table: string,
    data: any,
    options: Pick<QueryOptions, 'select'> = {}
  ): Promise<DatabaseResult<T | T[]>> => {
    try {
      return await DatabaseUtils.withRetry(async () => {
        const result = await supabase
          .from(table)
          .insert(data)
          .select(options.select || '*');
        const { data: insertedData, error } = result as any;

        if (error) {
          return {
            data: null,
            error: DatabaseUtils.handlePostgresError(error, `insert into ${table}`),
            success: false
          };
        }

        return {
          data: insertedData as T | T[],
          error: null,
          success: true
        };
      });
    } catch (error) {
      console.error(`Error en insert de ${table}:`, error);
      return {
        data: null,
        error: DB_ERRORS.CONNECTION_ERROR,
        success: false
      };
    }
  },

  /**
   * Actualiza registro por ID con tipado
   */
  update: async <T = any>(
    table: string,
    id: string,
    data: any,
    options: Pick<QueryOptions, 'select'> = {}
  ): Promise<DatabaseResult<T>> => {
    try {
      return await DatabaseUtils.withRetry(async () => {
        const result = await (supabase as any)
          .from(table)
          .update(data)
          .eq('id', id)
          .select(options.select || '*')
          .single();
        const { data: updatedData, error } = result as any;

        if (error) {
          return {
            data: null,
            error: DatabaseUtils.handlePostgresError(error, `update ${table}/${id}`),
            success: false
          };
        }

        return {
          data: updatedData as T,
          error: null,
          success: true
        };
      });
    } catch (error) {
      console.error(`Error en update de ${table}:`, error);
      return {
        data: null,
        error: DB_ERRORS.CONNECTION_ERROR,
        success: false
      };
    }
  },

  /**
   * Actualiza multiples registros
   */
  updateMany: async <T = any>(
    table: string,
    data: any,
    filters: FilterCondition[],
    options: Pick<QueryOptions, 'select'> = {}
  ): Promise<DatabaseResult<T[]>> => {
    try {
      return await DatabaseUtils.withRetry(async () => {
        let query = (supabase as any)
          .from(table)
          .update(data)
          .select(options.select || '*');
        
        // Aplicar filtros
        query = DatabaseUtils.applyFilters(query, filters);

        const result = await query;
        const { data: updatedData, error } = result as any;

        if (error) {
          return {
            data: null,
            error: DatabaseUtils.handlePostgresError(error, `updateMany ${table}`),
            success: false
          };
        }

        return {
          data: (updatedData || []) as T[],
          error: null,
          success: true
        };
      });
    } catch (error) {
      console.error(`Error en updateMany de ${table}:`, error);
      return {
        data: null,
        error: DB_ERRORS.CONNECTION_ERROR,
        success: false
      };
    }
  },

  /**
   * Elimina registro por ID
   */
  delete: async (
    table: string,
    id: string
  ): Promise<DatabaseResult<null>> => {
    try {
      return await DatabaseUtils.withRetry(async () => {
        const result = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        const { error } = result as any;

        if (error) {
          return {
            data: null,
            error: DatabaseUtils.handlePostgresError(error, `delete ${table}/${id}`),
            success: false
          };
        }

        return {
          data: null,
          error: null,
          success: true
        };
      });
    } catch (error) {
      console.error(`Error en delete de ${table}:`, error);
      return {
        data: null,
        error: DB_ERRORS.CONNECTION_ERROR,
        success: false
      };
    }
  },

  /**
   * Elimina multiples registros
   */
  deleteMany: async (
    table: string,
    filters: FilterCondition[]
  ): Promise<DatabaseResult<null>> => {
    try {
      return await DatabaseUtils.withRetry(async () => {
        let query = supabase.from(table).delete();
        
        // Aplicar filtros
        query = DatabaseUtils.applyFilters(query, filters);

        const result = await query;
        const { error } = result as any;

        if (error) {
          return {
            data: null,
            error: DatabaseUtils.handlePostgresError(error, `deleteMany ${table}`),
            success: false
          };
        }

        return {
          data: null,
          error: null,
          success: true
        };
      });
    } catch (error) {
      console.error(`Error en deleteMany de ${table}:`, error);
      return {
        data: null,
        error: DB_ERRORS.CONNECTION_ERROR,
        success: false
      };
    }
  },

  /**
   * Cuenta registros con filtros
   */
  count: async (
    table: string,
    filters: FilterCondition[] = []
  ): Promise<DatabaseResult<number>> => {
    try {
      return await DatabaseUtils.withRetry(async () => {
        let query = supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        // Aplicar filtros
        query = DatabaseUtils.applyFilters(query, filters);

        const result = await query;
        const { count, error } = result as any;

        if (error) {
          return {
            data: null,
            error: DatabaseUtils.handlePostgresError(error, `count ${table}`),
            success: false
          };
        }

        return {
          data: count || 0,
          error: null,
          success: true
        };
      });
    } catch (error) {
      console.error(`Error en count de ${table}:`, error);
      return {
        data: null,
        error: DB_ERRORS.CONNECTION_ERROR,
        success: false
      };
    }
  },

  /**
   * Ejecuta funciones RPC personalizadas
   */
  rpc: async <T = any>(
    functionName: string,
    parameters: any = {}
  ): Promise<DatabaseResult<T>> => {
    try {
      return await DatabaseUtils.withRetry(async () => {
        const result = await supabase.rpc(functionName, parameters);
        const { data, error } = result as any;

        if (error) {
          return {
            data: null,
            error: DatabaseUtils.handlePostgresError(error, `rpc ${functionName}`),
            success: false
          };
        }

        return {
          data: data as T,
          error: null,
          success: true
        };
      });
    } catch (error) {
      console.error(`Error en rpc ${functionName}:`, error);
      return {
        data: null,
        error: DB_ERRORS.CONNECTION_ERROR,
        success: false
      };
    }
  }
} as const;

// ==================== UTILIDADES ESPECIFICAS PARA T+PLUS ====================
export const TmasPlusDB = {
  /**
   * OPERACIONES DE USUARIOS
   */
  users: {
    /**
     * Busca usuario por email
     */
    findByEmail: async (email: string): Promise<DatabaseResult<UserRow>> => {
      const result = await SupabaseDatabase.select<UserRow>('users', {}, [
        { column: 'email', operator: 'eq', value: email.toLowerCase() }
      ]);

      if (!result.success || !result.data || result.data.length === 0) {
        return {
          data: null,
          error: result.error || 'Usuario no encontrado',
          success: false
        };
      }

      return {
        data: result.data[0],
        error: null,
        success: true
      };
    },

    /**
     * Busca usuario por auth_id
     */
    findByAuthId: async (authId: string): Promise<DatabaseResult<UserRow>> => {
      const result = await SupabaseDatabase.select<UserRow>('users', {}, [
        { column: 'auth_id', operator: 'eq', value: authId }
      ]);

      if (!result.success || !result.data || result.data.length === 0) {
        return {
          data: null,
          error: result.error || 'Usuario no encontrado',
          success: false
        };
      }

      return {
        data: result.data[0],
        error: null,
        success: true
      };
    },

    /**
     * Obtiene conductores activos por ciudad
     */
    getActiveDriversByCity: async (city: string, limit: number = 20): Promise<DatabaseResult<UserRow[]>> => {
      return SupabaseDatabase.select<UserRow>('users', 
        { 
          orderBy: 'rating',
          ascending: false,
          limit 
        },
        [
          { column: 'user_type', operator: 'eq', value: 'driver' },
          { column: 'driver_active_status', operator: 'eq', value: true },
          { column: 'approved', operator: 'eq', value: true },
          { column: 'blocked', operator: 'eq', value: false },
          { column: 'city', operator: 'eq', value: city }
        ]
      );
    },

    /**
     * Actualiza balance de wallet
     */
    updateWalletBalance: async (userId: string, newBalance: number): Promise<DatabaseResult<UserRow>> => {
      return SupabaseDatabase.update<UserRow>('users', userId, {
        wallet_balance: newBalance,
        updated_at: new Date().toISOString()
      });
    }
  },

  /**
   * OPERACIONES DE VEHICULOS
   */
  vehicles: {
    /**
     * Obtiene vehiculos activos de un conductor
     */
    findActiveByDriverId: async (driverId: string): Promise<DatabaseResult<CarRow[]>> => {
      return SupabaseDatabase.select<CarRow>('cars', {}, [
        { column: 'driver_id', operator: 'eq', value: driverId },
        { column: 'is_active', operator: 'eq', value: true }
      ]);
    },

    /**
     * Busca vehiculo por placa
     */
    findByPlate: async (plate: string): Promise<DatabaseResult<CarRow>> => {
      const result = await SupabaseDatabase.select<CarRow>('cars', {}, [
        { column: 'plate', operator: 'eq', value: plate.toUpperCase() }
      ]);

      if (!result.success || !result.data || result.data.length === 0) {
        return {
          data: null,
          error: result.error || 'Vehiculo no encontrado',
          success: false
        };
      }

      return {
        data: result.data[0],
        error: null,
        success: true
      };
    }
  },

  /**
   * OPERACIONES DE RESERVAS (CORE T+PLUS)
   */
  bookings: {
    /**
     * Obtiene reservas de un usuario con paginacion
     */
    findByUserId: async (
      userId: string, 
      userType: 'customer' | 'driver' = 'customer',
      page: number = 1,
      pageSize: number = 20
    ): Promise<DatabaseResult<PaginationResult<BookingRow>>> => {
      const column = userType === 'customer' ? 'customer_id' : 'driver_id';
      
      return SupabaseDatabase.selectWithPagination<BookingRow>('bookings', page, pageSize,
        { 
          orderBy: 'created_at',
          ascending: false
        },
        [{ column, operator: 'eq', value: userId }]
      );
    },

    /**
     * Obtiene reservas activas
     */
    findActive: async (city?: string): Promise<DatabaseResult<BookingRow[]>> => {
      const filters: FilterCondition[] = [
        { column: 'status', operator: 'in', value: ['NEW', 'ACCEPTED', 'STARTED', 'REACHED'] }
      ];

      if (city) {
        filters.push({ column: 'customer_city', operator: 'eq', value: city });
      }

      return SupabaseDatabase.select<BookingRow>('bookings', 
        { 
          orderBy: 'created_at',
          ascending: false,
          limit: 50
        },
        filters
      );
    },

    /**
     * Actualiza estado de reserva
     */
    updateStatus: async (
      bookingId: string, 
      status: BookingStatus,
      additionalData?: Partial<BookingUpdate>
    ): Promise<DatabaseResult<BookingRow>> => {
      const updateData: BookingUpdate = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      return SupabaseDatabase.update<BookingRow>('bookings', bookingId, updateData);
    },

    /**
     * Asigna conductor a reserva
     */
    assignDriver: async (
      bookingId: string,
      driverId: string,
      driverData: {
        name: string;
        image?: string;
        contact: string;
        rating: number;
        carId: string;
        carData: {
          image?: string;
          number: string;
          model: string;
          make: string;
          color: string;
        };
      }
    ): Promise<DatabaseResult<BookingRow>> => {
      const updateData: BookingUpdate = {
        driver_id: driverId,
        car_id: driverData.carId,
        status: 'ACCEPTED',
        driver_name: driverData.name,
        driver_image: driverData.image,
        driver_contact: driverData.contact,
        driver_rating: driverData.rating,
        car_image: driverData.carData.image,
        vehicle_number: driverData.carData.number,
        vehicle_model: driverData.carData.model,
        vehicle_make: driverData.carData.make,
        vehicle_color: driverData.carData.color,
        updated_at: new Date().toISOString()
      };

      return SupabaseDatabase.update<BookingRow>('bookings', bookingId, updateData);
    }
  },

  /**
   * OPERACIONES DE TRACKING
   */
  tracking: {
    /**
     * Inserta punto de tracking
     */
    insertLocation: async (
      bookingId: string,
      latitude: number,
      longitude: number,
      status: string
    ): Promise<DatabaseResult<TrackingRow>> => {
      const trackingData: TrackingInsert = {
        booking_id: bookingId,
        status,
        latitude,
        longitude,
        timestamp_ms: Date.now()
      };

      const result = await SupabaseDatabase.insert<TrackingRow>('tracking', trackingData);
      
      if (result.success && Array.isArray(result.data)) {
        return {
          data: result.data[0],
          error: null,
          success: true
        };
      }

      return result as DatabaseResult<TrackingRow>;
    },

    /**
     * Obtiene tracking de una reserva
     */
    findByBookingId: async (bookingId: string): Promise<DatabaseResult<TrackingRow[]>> => {
      return SupabaseDatabase.select<TrackingRow>('tracking',
        {
          orderBy: 'timestamp_ms',
          ascending: true
        },
        [{ column: 'booking_id', operator: 'eq', value: bookingId }]
      );
    }
  },

  /**
   * OPERACIONES DE WALLET
   */
  wallet: {
    /**
     * Registra transaccion de wallet
     */
    recordTransaction: async (
      userId: string,
      type: WalletTransactionType,
      amount: number,
      description: string,
      newBalance: number,
      bookingId?: string
    ): Promise<DatabaseResult<WalletHistoryRow>> => {
      const transactionData: WalletHistoryInsert = {
        user_id: userId,
        type,
        amount,
        balance: newBalance,
        description,
        booking_id: bookingId
      };

      const result = await SupabaseDatabase.insert<WalletHistoryRow>('wallet_history', transactionData);
      
      if (result.success && Array.isArray(result.data)) {
        return {
          data: result.data[0],
          error: null,
          success: true
        };
      }

      return result as DatabaseResult<WalletHistoryRow>;
    },

    /**
     * Obtiene historial de wallet
     */
    getHistory: async (
      userId: string,
      page: number = 1,
      pageSize: number = 20
    ): Promise<DatabaseResult<PaginationResult<WalletHistoryRow>>> => {
      return SupabaseDatabase.selectWithPagination<WalletHistoryRow>('wallet_history', page, pageSize,
        {
          orderBy: 'created_at',
          ascending: false
        },
        [{ column: 'user_id', operator: 'eq', value: userId }]
      );
    }
  },

  /**
   * OPERACIONES DE NOTIFICACIONES
   */
  notifications: {
    /**
     * Envia notificacion a usuario
     */
    send: async (
      userId: string,
      title: string,
      message: string,
      type: string = 'general',
      data?: any,
      bookingId?: string
    ): Promise<DatabaseResult<NotificationRow>> => {
      const notificationData: NotificationInsert = {
        user_id: userId,
        title,
        message,
        type,
        data,
        booking_id: bookingId
      };

      const result = await SupabaseDatabase.insert<NotificationRow>('notifications', notificationData);
      
      if (result.success && Array.isArray(result.data)) {
        return {
          data: result.data[0],
          error: null,
          success: true
        };
      }

      return result as DatabaseResult<NotificationRow>;
    },

    /**
     * Obtiene notificaciones no leidas
     */
    getUnread: async (userId: string): Promise<DatabaseResult<NotificationRow[]>> => {
      return SupabaseDatabase.select<NotificationRow>('notifications',
        {
          orderBy: 'created_at',
          ascending: false,
          limit: 50
        },
        [
          { column: 'user_id', operator: 'eq', value: userId },
          { column: 'is_read', operator: 'eq', value: false }
        ]
      );
    },

    /**
     * Marca notificaciones como leidas
     */
    markAsRead: async (notificationIds: string[]): Promise<DatabaseResult<NotificationRow[]>> => {
      return SupabaseDatabase.updateMany<NotificationRow>('notifications',
        { is_read: true },
        [{ column: 'id', operator: 'in', value: notificationIds }]
      );
    }
  }
} as const;

// ==================== EXPORTACIONES PRINCIPALES ====================
export default SupabaseDatabase;

export {
  DatabaseUtils,
  DB_CONFIG,
  DB_ERRORS
};

export type {
  DatabaseResult,
  QueryOptions,
  FilterCondition,
  PaginationResult
};