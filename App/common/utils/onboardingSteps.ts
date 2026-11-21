/**
 * Pasos pendientes de registro. Lógica pura (sin React Native) para poder
 * probarla con Jest. Un campo cuenta como hecho si es un string no vacío.
 *
 * NO usa `users.approved`: lo marca el equipo desde el dashboard y hay
 * conductores aprobados con documentos incompletos.
 */

export type OnboardingTarget = 'ImageGallery' | 'Docs' | 'CarsEdit' | 'DriverPaymentMethods';

export type OnboardingStep = {
  key: string;
  label: string;
  done: boolean;
  target: OnboardingTarget;
};

/** Columnas de `users` que se consultan (nombres de BD, snake_case). */
export const ONBOARDING_USER_COLUMNS = [
  'id',
  'profile_image',
  'verify_id_image',
  'verify_id_image_bk',
  'license_image',
  'license_image_back',
  'soat_image',
  'card_prop_image',
  'card_prop_image_bk',
] as const;

export type OnboardingProfile = Partial<Record<(typeof ONBOARDING_USER_COLUMNS)[number], unknown>>;

export const hasValue = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;

/**
 * Une el perfil remoto (REST) con el de Redux: basta que uno tenga el valor.
 * Así un documento recién subido cuenta aunque el REST aún no lo refleje.
 */
export function mergeProfiles(
  remote: OnboardingProfile | null | undefined,
  local: OnboardingProfile | null | undefined,
): OnboardingProfile {
  const out: OnboardingProfile = {};
  for (const col of ONBOARDING_USER_COLUMNS) {
    out[col] = hasValue(remote?.[col]) ? remote?.[col] : local?.[col];
  }
  return out;
}

/**
 * @param vehicleCount número de vehículos del conductor, o null si no se pudo
 *   consultar (se asume cumplido para no molestar por un fallo de red).
 * @param daviplataOk true si ya tiene DaviPlata de 10 dígitos; null = no consultado (no bloquear).
 */
export function buildOnboardingSteps(
  userType: string,
  p: OnboardingProfile,
  vehicleCount: number | null,
  daviplataOk: boolean | null = null,
): OnboardingStep[] {
  const t = String(userType || '').trim().toLowerCase();

  if (t === 'driver') {
    return [
      { key: 'profile_image', label: 'Foto de perfil', done: hasValue(p.profile_image), target: 'Docs' },
      { key: 'id_front', label: 'Cédula (frente)', done: hasValue(p.verify_id_image), target: 'ImageGallery' },
      { key: 'id_back', label: 'Cédula (reverso)', done: hasValue(p.verify_id_image_bk), target: 'ImageGallery' },
      { key: 'license_front', label: 'Licencia (frente)', done: hasValue(p.license_image), target: 'ImageGallery' },
      { key: 'license_back', label: 'Licencia (reverso)', done: hasValue(p.license_image_back), target: 'ImageGallery' },
      { key: 'soat', label: 'SOAT', done: hasValue(p.soat_image), target: 'ImageGallery' },
      { key: 'card_front', label: 'Tarjeta de propiedad (frente)', done: hasValue(p.card_prop_image), target: 'ImageGallery' },
      { key: 'card_back', label: 'Tarjeta de propiedad (reverso)', done: hasValue(p.card_prop_image_bk), target: 'ImageGallery' },
      { key: 'vehicle', label: 'Al menos un vehículo', done: vehicleCount == null ? true : vehicleCount > 0, target: 'CarsEdit' },
      {
        key: 'daviplata',
        label: 'DaviPlata (método de pago)',
        done: daviplataOk == null ? true : daviplataOk,
        target: 'DriverPaymentMethods',
      },
    ];
  }

  if (t === 'customer') {
    return [
      { key: 'id_front', label: 'Cédula (frente)', done: hasValue(p.verify_id_image), target: 'ImageGallery' },
      { key: 'id_back', label: 'Cédula (reverso)', done: hasValue(p.verify_id_image_bk), target: 'ImageGallery' },
      { key: 'profile_image', label: 'Foto de perfil', done: hasValue(p.profile_image), target: 'Docs' },
    ];
  }

  return [];
}
