/**
 * VALIDADORES DE FORMATO
 * Funciones puras que validan estructura de datos
 */

/**
 * Valida si un email tiene formato correcto
 * @param email - Email a validar
 * @returns true si formato es válido, false si no
 */
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  console.log(`📧 [validateEmailFormat] "${email}" -> ${isValid ? '✓ VÁLIDO' : '✗ INVÁLIDO'}`);
  return isValid;
};

/**
 * Valida si un teléfono tiene formato correcto
 * Para Colombia: 10 dígitos (3133752565)
 * Para otros países: extender según sea necesario
 * @param phone - Teléfono a validar (solo dígitos)
 * @returns true si formato es válido, false si no
 */
export const validatePhoneFormat = (phone: string): boolean => {
  // Remover caracteres no numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  // Para Colombia, debe tener 10 dígitos
  const isValid = cleanPhone.length === 10 && /^[0-9]{10}$/.test(cleanPhone);
  console.log(`📱 [validatePhoneFormat] "${phone}" -> ${isValid ? '✓ VÁLIDO' : '✗ INVÁLIDO'} (${cleanPhone.length} dígitos)`);
  return isValid;
};

/**
 * Formato único del código de referido: AAA-XXXXX (3 letras, guion, 5 letras/dígitos, mayúsculas)
 * Limpia el texto y inserta el guion después del tercer carácter mientras se escribe.
 */
export const formatReferralCode = (raw: string | null | undefined): string => {
  const clean = (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
};

export const isValidReferralCodeFormat = (raw: string | null | undefined): boolean =>
  /^[A-Z]{3}-[A-Z0-9]{5}$/.test(formatReferralCode(raw));

/**
 * Normaliza email: trim + lowercase
 * @param email - Email sin normalizar
 * @returns Email normalizado
 */
export const normalizeEmail = (email: string): string => {
  const normalized = email.trim().toLowerCase();
  if (email !== normalized) {
    console.log(`🔄 [normalizeEmail] "${email}" -> "${normalized}"`);
  }
  return normalized;
};

/**
 * Extrae solo dígitos de un teléfono
 * @param phone - Teléfono con posibles caracteres especiales
 * @returns Solo dígitos
 */
export const extractPhoneDigits = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (phone !== digits) {
    console.log(`🔢 [extractPhoneDigits] "${phone}" -> "${digits}"`);
  }
  return digits;
};
