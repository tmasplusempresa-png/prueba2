import supabase from '@/config/SupabaseConfig';
import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';

/**
 * Servicio para OTP: generación, guardado y validación
 */
export const OtpService = {
  /**
   * Genera un OTP de 4 dígitos (0000-9999)
   */
  generateOtp(): string {
    const otp = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    console.log("\n════════════════════════════════════════════════════════════");
    console.log("🔐🔐🔐 OTP SERVICIO - GENERAR OTP 🔐🔐🔐");
    console.log("════════════════════════════════════════════════════════════");
    console.log("🔐 CÓDIGO GENERADO:", otp);
    console.log("🔐 Un código de **4 dígitos**");
    console.log("🔐 Tipo:", typeof otp, "- Largo:", otp.length);
    console.log("🔐 Este código DEBE mostrarse en la pantalla");
    console.log("════════════════════════════════════════════════════════════\n");
    return otp;
  },

  /**
   * Guarda el OTP en la reserva (Supabase)
   */
  async saveOtp(bookingId: string, otpCode: string): Promise<boolean> {
    console.log("💾 [OTP SERVICE] Guardando OTP en Supabase...");
    console.log("   BookingID:", bookingId);
    console.log("   OTP Code:", otpCode);
    try {
      const headers = await getSupabaseAuthHeaders(true);
      const url = `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`;
      
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({
          otp: otpCode,
          otp_verified: false,
          otp_generated_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      console.log("✅ [OTP SERVICE] OTP guardado correctamente");
      return true;
    } catch (err) {
      console.error('❌ [OTP SERVICE] Error guardando OTP:', err);
      return false;
    }
  },

  /**
   * Valida el OTP contra Supabase
   */
  async validateOtp(bookingId: string, inputOtp: string): Promise<boolean> {
    console.log("✔️ [OTP SERVICE] Validando OTP...");
    console.log("   BookingID:", bookingId);
    console.log("   Input OTP:", inputOtp);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('otp')
        .eq('id', bookingId)
        .single();
      if (error) throw error;
      
      const isValid = data && (data as any).otp === inputOtp;
      if (isValid) {
        console.log("✅ [OTP SERVICE] OTP VÁLIDO ✅");
        // Marcar como verificado
        await this.markOtpAsVerified(bookingId);
      } else {
        console.log("❌ [OTP SERVICE] OTP INVÁLIDO");
        console.log("   Esperado:", (data as any)?.otp);
        console.log("   Ingresado:", inputOtp);
      }
      return isValid;
    } catch (err) {
      console.error('❌ [OTP SERVICE] Error validando OTP:', err);
      return false;
    }
  },

  /**
   * Obtiene el OTP actual de una reserva
   */
  async getOtp(bookingId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('otp, otp_verified')
        .eq('id', bookingId)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('❌ [OTP SERVICE] Error obteniendo OTP:', err);
      return null;
    }
  },

  /**
   * Marca el OTP como verificado
   */
  async markOtpAsVerified(bookingId: string): Promise<boolean> {
    try {
      const headers = await getSupabaseAuthHeaders(true);
      const url = `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`;
      
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({
          otp_verified: true,
          otp_verified_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      console.log("✅ [OTP SERVICE] OTP marcado como verificado");
      return true;
    } catch (err) {
      console.error('❌ [OTP SERVICE] Error marcando OTP como verificado:', err);
      return false;
    }
  },
};
