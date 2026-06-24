import { useEffect, useState, useRef } from 'react';
import { ValidationService } from '@/common/services/ValidationService';

const DEBOUNCE_DELAY = 2000; // Aumentado de 800ms a 2s para evitar rate limit

/**
 * Hook para validación de email con debounce mejorado
 * Evita hacer demasiadas validaciones al mismo tiempo
 * @param email - Email a validar
 * @param emailFormatValid - Si el formato es válido
 * @returns { exists: boolean, isChecking: boolean }
 */
export const useEmailValidation = (
  email: string,
  emailFormatValid: boolean,
  enabled: boolean = true
) => {
  const [exists, setExists] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCheckedRef = useRef<string>('');
  const requestCountRef = useRef<number>(0);

  useEffect(() => {
    // No buscar si email no es válido o está vacío
    if (!enabled || !email || !emailFormatValid || email.indexOf('@') === -1) {
      setExists(false);
      setIsChecking(false);
      setError(null);
      return;
    }

    // No validar si es el mismo email que ya validamos
    if (lastCheckedRef.current === email) {
      setIsChecking(false);
      return;
    }

    console.log(`⏱️ [useEmailValidation] Debounce iniciado para: ${email}`);
    let mounted = true;
    setIsChecking(true);
    setError(null);
    requestCountRef.current += 1;
    const currentRequest = requestCountRef.current;

    const timeoutId = setTimeout(async () => {
      // Solo procesar si es el request más reciente
      if (!mounted || currentRequest !== requestCountRef.current) return;

      console.log(`🔄 [useEmailValidation] Ejecutando validación para: ${email}`);
      try {
        const { exists: emailExists, error: checkError } = await ValidationService.checkEmailExists(email);
        if (mounted && currentRequest === requestCountRef.current) {
          if (checkError) {
            // Validación indeterminada: NO marcar como disponible, NO cachear el email
            setExists(false);
            setError(checkError);
            console.warn(`⚠️ [useEmailValidation] Validación fallida (${checkError}) — el botón quedará bloqueado`);
          } else {
            setExists(emailExists);
            setError(null);
            lastCheckedRef.current = email;
            console.log(`📊 [useEmailValidation] Resultado: ${emailExists ? 'EXISTE' : 'DISPONIBLE'}`);
          }
        }
      } catch (err: any) {
        console.error('❌ [useEmailValidation] Error:', err);
        if (mounted && currentRequest === requestCountRef.current) {
          setExists(false);
          setError(err?.message || 'Error verificando email');
          // No cachear: permitir reintento al próximo cambio
        }
      } finally {
        if (mounted && currentRequest === requestCountRef.current) {
          setIsChecking(false);
        }
      }
    }, DEBOUNCE_DELAY);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      console.log(`🚫 [useEmailValidation] Debounce cancelado para: ${email}`);
    };
  }, [email, emailFormatValid, enabled]);

  return { exists, isChecking, error };
};
