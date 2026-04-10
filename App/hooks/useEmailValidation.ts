import { useEffect, useState } from 'react';
import { ValidationService } from '@/common/services/ValidationService';

const DEBOUNCE_DELAY = 800;

/**
 * Hook para validación de email con debounce
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

  useEffect(() => {
    // No buscar si email no es válido o está vacío
    if (!enabled || !email || !emailFormatValid || email.indexOf('@') === -1) {
      setExists(false);
      setIsChecking(false);
      return;
    }

    console.log(`⏱️ [useEmailValidation] Debounce iniciado para: ${email}`);
    let mounted = true;
    setIsChecking(true);

    const timeoutId = setTimeout(async () => {
      if (!mounted) return;

      console.log(`🔄 [useEmailValidation] Ejecutando validación para: ${email}`);
      try {
        const { exists: emailExists } = await ValidationService.checkEmailExists(email);
        if (mounted) {
          setExists(emailExists);
          console.log(`📊 [useEmailValidation] Resultado: ${emailExists ? 'EXISTE' : 'DISPONIBLE'}`);
        }
      } catch (error) {
        console.error('❌ [useEmailValidation] Error:', error);
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
      console.log(`🚫 [useEmailValidation] Debounce cancelado para: ${email}`);
    };
  }, [email, emailFormatValid, enabled]);

  return { exists, isChecking };
};
