import { useEffect, useState } from 'react';
import { ValidationService } from '@/common/services/ValidationService';

const DEBOUNCE_DELAY = 800;

/**
 * Hook para validación de teléfono con debounce
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

  useEffect(() => {
    // No buscar si teléfono no es válido o está vacío
    if (!enabled || !phone || !phoneFormatValid || phone.length < 10) {
      setExists(false);
      setIsChecking(false);
      return;
    }

    console.log(`⏱️ [usePhoneValidation] Debounce iniciado para: ${countryCode}${phone}`);
    let mounted = true;
    setIsChecking(true);

    const timeoutId = setTimeout(async () => {
      if (!mounted) return;

      console.log(`🔄 [usePhoneValidation] Ejecutando validación para: ${countryCode}${phone}`);
      try {
        const { exists: phoneExists } = await ValidationService.checkPhoneExists(
          phone,
          countryCode
        );
        if (mounted) {
          setExists(phoneExists);
          console.log(`📊 [usePhoneValidation] Resultado: ${phoneExists ? 'EXISTE' : 'DISPONIBLE'}`);
        }
      } catch (error) {
        console.error('❌ [usePhoneValidation] Error:', error);
        if (mounted) setExists(false);
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    }, DEBOUNCE_DELAY);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      console.log(`🚫 [usePhoneValidation] Debounce cancelado para: ${countryCode}${phone}`);
    };
  }, [phone, phoneFormatValid, countryCode, enabled]);

  return { exists, isChecking };
};
