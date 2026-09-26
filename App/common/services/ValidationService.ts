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

      // Durante el registro NO hay sesión → `anon`. No se puede leer `persona`/`users`
      // directamente (permission denied, y expondría PII). Se usa el RPC
      // `verificar_disponibilidad` (SECURITY DEFINER, concedido a anon), que normaliza
      // el teléfono internamente. En el esquema nuevo el teléfono se guarda como número
      // local de 10 dígitos, así que se envía `mobileOnly`.
      const { data, error } = await supabase.rpc('verificar_disponibilidad', {
        p_telefono: mobileOnly,
      } as any);

      const duration = Date.now() - startTime;

      if (error) {
        console.error(`❌ [ValidationService] Error verificando teléfono (${duration}ms):`, error.message);
        return {
          exists: false,
          error: error.message,
        };
      }

      const exists = (data as any)?.mobile_exists === true;

      if (exists) {
        console.log(`❌ [ValidationService] teléfono: NO DISPONIBLE (${duration}ms)`);
      } else {
        console.log(`✅ [ValidationService] teléfono: DISPONIBLE (${duration}ms)`);
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
