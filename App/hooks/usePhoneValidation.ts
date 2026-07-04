import { useEffect, useState, useRef } from 'react';
import { ValidationService } from '@/common/services/ValidationService';

const DEBOUNCE_DELAY = 2000; // Aumentado de 800ms a 2s para evitar rate limit

/**
 * Hook para validación de teléfono con debounce mejorado
 * Evita hacer demasiadas validaciones al mismo tiempo
 * @param phone - Teléfono (solo números)
 * @param phoneFormatValid - Si el formato es válido
 * @param countryCode - Código del país
 * @returns { exists: boolean, isChecking: boolean }
 */
export const usePhoneValidation = (
  phone: string,
  phoneFormatValid: boolean,
  countryCode: string = '+57',
  enabled: boolean = true
) => {
  const [exists, setExists] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCheckedRef = useRef<string>('');
  const requestCountRef = useRef<number>(0);

  useEffect(() => {
    // No buscar si teléfono no es válido o está vacío
    if (!enabled || !phone || !phoneFormatValid || phone.length < 10) {
      setExists(false);
      setIsChecking(false);
      setError(null);
      return;
    }

    const fullPhone = `${countryCode}${phone}`;

    // No validar si es el mismo teléfono que ya validamos
    if (lastCheckedRef.current === fullPhone) {
      setIsChecking(false);
      return;
    }

    console.log(`⏱️ [usePhoneValidation] Debounce iniciado para: ${fullPhone}`);
    let mounted = true;
    setIsChecking(true);
    setError(null);
    requestCountRef.current += 1;
    const currentRequest = requestCountRef.current;

    const timeoutId = setTimeout(async () => {
      // Solo procesar si es el request más reciente
      if (!mounted || currentRequest !== requestCountRef.current) return;

      console.log(`🔄 [usePhoneValidation] Ejecutando validación para: ${fullPhone}`);
      try {
        const { exists: phoneExists, error: checkError } = await ValidationService.checkPhoneExists(
          phone,
          countryCode
        );
        if (mounted && currentRequest === requestCountRef.current) {
          if (checkError) {
            setExists(false);
            setError(checkError);
            console.warn(`⚠️ [usePhoneValidation] Validación fallida (${checkError}) — el botón quedará bloqueado`);
          } else {
            setExists(phoneExists);
            setError(null);
            lastCheckedRef.current = fullPhone;
            console.log(`📊 [usePhoneValidation] Resultado: ${phoneExists ? 'EXISTE' : 'DISPONIBLE'}`);
          }
        }
      } catch (err: any) {
        console.error('❌ [usePhoneValidation] Error:', err);
        if (mounted && currentRequest === requestCountRef.current) {
          setExists(false);
          setError(err?.message || 'Error verificando teléfono');
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
      console.log(`🚫 [usePhoneValidation] Debounce cancelado para: ${fullPhone}`);
    };
  }, [phone, phoneFormatValid, countryCode, enabled]);

  return { exists, isChecking, error };
};
