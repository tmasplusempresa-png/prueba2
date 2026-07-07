/**
 * Canonicaliza el nombre de categoría de vehículo a los 4 nombres oficiales:
 *   ConfortPlus · TaxiPlus · VanPlus · XPlus
 *
 * A lo largo del tiempo convivieron 3 convenciones para la misma categoría:
 *   1) Canónico actual (móvil/reservas): "TaxiPlus", "VanPlus", "XPlus", "ConfortPlus"
 *   2) Legacy móvil (features.carType):   "T+Plus Taxi/Van/Particular/Especial", "TREAS-X/E"
 *   3) Dashboard web (cars.service_type):  "taxi_plus", "van_plus", "particular", "servicio_especial"
 *
 * Esta función las reconcilia SOLO para mostrar en la UI; no reescribe la BD.
 */
const CANONICAL_BY_KEY: Record<string, string> = {
  // TaxiPlus
  'taxiplus': 'TaxiPlus',
  't+plus taxi': 'TaxiPlus',
  'taxi_plus': 'TaxiPlus',
  'taxi plus': 'TaxiPlus',
  'treas-t': 'TaxiPlus',
  // VanPlus
  'vanplus': 'VanPlus',
  't+plus van': 'VanPlus',
  'van_plus': 'VanPlus',
  'van plus': 'VanPlus',
  'treas-van': 'VanPlus',
  // XPlus (Particular)
  'xplus': 'XPlus',
  't+plus particular': 'XPlus',
  'particular': 'XPlus',
  'treas-x': 'XPlus',
  // ConfortPlus (Servicio Especial)
  'confortplus': 'ConfortPlus',
  'comfortplus': 'ConfortPlus',
  't+plus especial': 'ConfortPlus',
  'servicio_especial': 'ConfortPlus',
  'especial': 'ConfortPlus',
  'treas-e': 'ConfortPlus',
};

/**
 * Devuelve el nombre canónico para mostrar. Si no reconoce el valor,
 * regresa el original tal cual (para no ocultar datos inesperados).
 */
export const toCanonicalCarType = (value?: string | null): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return CANONICAL_BY_KEY[raw.toLowerCase()] || raw;
};
