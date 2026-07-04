import supabase from '@/config/SupabaseConfig';

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
      const { data, error } = await supabase.rpc('check_email_exists', {
        check_email: trimmedEmail,
      } as any);

      const duration = Date.now() - startTime;

      if (error) {
        console.error('⚠️ [ValidationService] Error en RPC check_email_exists:', error?.message);
        return { exists: false, error: error?.message };
      }

      const exists = data === true;
      console.log(`${exists ? '✅' : '✓'} [ValidationService] Email ${exists ? 'existe' : 'disponible'} (${duration}ms)`);
      return { exists };
    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ [ValidationService] Error verificando email (${duration}ms):`, err?.message);
      return {
        exists: false,
        error: err?.message || 'Error checking email'
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
