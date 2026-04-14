import supabase from '@/config/SupabaseConfig';

const QUERY_TIMEOUT = 5000; // 5 segundos como en la lógica que sí funcionaba

const runWithTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

/**
 * Servicio de validación contra Supabase
 * Verifica existencia de email y teléfono en BD
 */
export const ValidationService = {
  /**
   * Verifica si un email ya existe en la BD
   * @param email - Email a verificar
   * @returns { exists: boolean, error?: string }
   */
  async checkEmailExists(email: string): Promise<{ exists: boolean; error?: string }> {
    const trimmedEmail = email.toLowerCase().trim();
    const startTime = Date.now();
    
    console.log('🔍 [ValidationService] Verificando email:', trimmedEmail);
    
    try {
      // Buscar en tabla 'users' con timeout usando Promise.race
      const queryPromise = supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('email', trimmedEmail);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT)
      );
      
      const { data: usersData, error: usersError, count } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;
      
      const duration = Date.now() - startTime;
      
      if (usersError) {
        console.warn('⚠️ [ValidationService] Error en búsqueda users:', usersError?.message);
      }
      
      const userCount = typeof count === 'number' ? count : Array.isArray(usersData) ? usersData.length : 0;
      if (userCount > 0) {
        console.log(`✅ [ValidationService] Email existe en users (${duration}ms) count=${userCount}`);
        return { exists: true };
      }
      
      // Intentar búsqueda en auth.users usando RPC si existe
      try {
        const rpcQueryPromise = supabase.rpc('check_email_exists', {
          check_email: trimmedEmail,
        } as any);
        
        const rpcTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), QUERY_TIMEOUT)
        );
        
        const { data: rpcData, error: rpcError } = await Promise.race([
          rpcQueryPromise,
          rpcTimeoutPromise
        ]) as any;
        
        if (rpcData === true) {
          console.log(`✅ [ValidationService] Email existe en auth.users (${Date.now() - startTime}ms)`);
          return { exists: true };
        }
      } catch (rpcError: any) {
        console.warn('⚠️ [ValidationService] RPC check_email_exists no disponible:', rpcError?.message);
      }
      
      console.log(`✓ [ValidationService] Email disponible (${duration}ms)`);
      return { exists: false };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ [ValidationService] Error verificando email (${duration}ms):`, error?.message);
      return { 
        exists: false, 
        error: error?.message || 'Error checking email' 
      };
    }
  },

  /**
   * Verifica si un teléfono ya existe en la BD
   * @param phone - Teléfono solo números (3133752565)
   * @param countryCode - Código país (+57, +1, etc)
   * @returns { exists: boolean, error?: string }
   */
  async checkPhoneExists(
    phone: string, 
    countryCode: string = '+57'
  ): Promise<{ exists: boolean; error?: string }> {
    const startTime = Date.now();
    
    try {
      const mobileOnly = String(phone || '').replace(/\D/g, '');
      const fullPhone = `${countryCode}${mobileOnly}`;

      console.log('📱 [ValidationService] Verificando teléfono:', { fullPhone, mobileOnly });

      const fullPhoneQuery = supabase
        .from('users')
        .select('id,mobile')
        .eq('mobile', fullPhone)
        .limit(1);

      const { data: fullPhoneData, error: fullPhoneError } = await fullPhoneQuery as any;

      if (fullPhoneError) {
        const duration = Date.now() - startTime;
        console.error(`❌ [ValidationService] Error verificando fullPhone (${duration}ms):`, fullPhoneError.message);
        return {
          exists: false,
          error: fullPhoneError.message,
        };
      }

      if (Array.isArray(fullPhoneData) && fullPhoneData.length > 0) {
        const duration = Date.now() - startTime;
        console.log(`❌ [ValidationService] users.mobile: NO DISPONIBLE (${duration}ms)`);
        console.log('[ValidationService] Coincidencia users.mobile:', fullPhoneData[0]?.mobile);
        return { exists: true };
      }

      const mobileOnlyQuery = supabase
        .from('users')
        .select('id,mobile')
        .eq('mobile', mobileOnly)
        .limit(1);

      const { data: mobileOnlyData, error: mobileOnlyError } = await mobileOnlyQuery as any;
      const duration = Date.now() - startTime;

      if (mobileOnlyError) {
        console.error(`❌ [ValidationService] Error verificando mobileOnly (${duration}ms):`, mobileOnlyError.message);
        return {
          exists: false,
          error: mobileOnlyError.message,
        };
      }

      const exists = Array.isArray(mobileOnlyData) && mobileOnlyData.length > 0;

      if (exists) {
        console.log(`❌ [ValidationService] users.mobile: NO DISPONIBLE (${duration}ms)`);
        console.log('[ValidationService] Coincidencia users.mobile:', mobileOnlyData?.[0]?.mobile);
      } else {
        console.log(`✅ [ValidationService] users.mobile: DISPONIBLE (${duration}ms)`);
      }

      return { exists };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ [ValidationService] Error verificando teléfono (${duration}ms):`, error?.message);
      return { 
        exists: false, 
        error: error?.message || 'Error checking phone' 
      };
    }
  },
};
