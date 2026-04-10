/**
 * vehicleRules.ts
 * ─────────────────────────────────────────────────────────────────
 * Módulo de lógica de negocio pura para la gestión de vehículos y
 * conductores en T+Plus.
 *
 * REGLAS DEL SISTEMA:
 *   R1 – Crear vehículo es OBLIGATORIO para operar como conductor.
 *   R2 – Cada conductor puede tener MÁXIMO 2 vehículos registrados.
 *   R3 – Cada vehículo puede estar asociado a MÁXIMO 3 conductores.
 *
 * Todas las funciones son puras (sin efectos secundarios) para que
 * puedan probarse de forma determinista y usarse tanto en el cliente
 * como en Cloud Functions.
 * ─────────────────────────────────────────────────────────────────
 */

// ── Constantes de negocio ─────────────────────────────────────────
export const VEHICLE_RULES = {
  /** Un conductor debe tener al menos un vehículo para operar. */
  MIN_VEHICLES_PER_DRIVER: 1,
  /** Límite máximo de vehículos que un conductor puede registrar. */
  MAX_VEHICLES_PER_DRIVER: 2,
  /** Límite máximo de conductores que pueden estar asociados a un vehículo. */
  MAX_DRIVERS_PER_VEHICLE: 3,
} as const;

// ── Tipos de resultado ────────────────────────────────────────────
export type VehicleRuleCode =
  | "VEHICLE_REQUIRED"
  | "DRIVER_VEHICLE_LIMIT_REACHED"
  | "VEHICLE_DRIVER_LIMIT_REACHED"
  | "OK";

export interface VehicleValidationResult {
  valid: boolean;
  code: VehicleRuleCode;
  message: string;
}

// ── Helpers internos ──────────────────────────────────────────────
const ok = (): VehicleValidationResult => ({
  valid: true,
  code: "OK",
  message: "",
});

const fail = (
  code: Exclude<VehicleRuleCode, "OK">,
  message: string
): VehicleValidationResult => ({ valid: false, code, message });

// ── R1: Vehículo obligatorio ──────────────────────────────────────
/**
 * Valida que un conductor tiene al menos un vehículo registrado.
 *
 * @param currentVehicleCount - Número de vehículos actuales del conductor.
 * @returns VehicleValidationResult
 */
export function validateDriverHasVehicle(
  currentVehicleCount: number
): VehicleValidationResult {
  if (currentVehicleCount < VEHICLE_RULES.MIN_VEHICLES_PER_DRIVER) {
    return fail(
      "VEHICLE_REQUIRED",
      `El conductor debe tener al menos ${VEHICLE_RULES.MIN_VEHICLES_PER_DRIVER} vehículo registrado para operar.`
    );
  }
  return ok();
}

// ── R2: Máximo 2 vehículos por conductor ─────────────────────────
/**
 * Valida si un conductor puede registrar un vehículo adicional.
 *
 * @param currentVehicleCount - Número de vehículos que el conductor ya tiene registrados.
 * @returns VehicleValidationResult
 */
export function validateDriverCanAddVehicle(
  currentVehicleCount: number
): VehicleValidationResult {
  if (currentVehicleCount >= VEHICLE_RULES.MAX_VEHICLES_PER_DRIVER) {
    return fail(
      "DRIVER_VEHICLE_LIMIT_REACHED",
      `Un conductor no puede tener más de ${VEHICLE_RULES.MAX_VEHICLES_PER_DRIVER} vehículos registrados.`
    );
  }
  return ok();
}

// ── R3: Máximo 3 conductores por vehículo ────────────────────────
/**
 * Valida si un vehículo puede aceptar un conductor adicional.
 *
 * @param currentDriverCount - Número de conductores que el vehículo ya tiene asociados.
 * @returns VehicleValidationResult
 */
export function validateVehicleCanAddDriver(
  currentDriverCount: number
): VehicleValidationResult {
  if (currentDriverCount >= VEHICLE_RULES.MAX_DRIVERS_PER_VEHICLE) {
    return fail(
      "VEHICLE_DRIVER_LIMIT_REACHED",
      `Un vehículo no puede tener más de ${VEHICLE_RULES.MAX_DRIVERS_PER_VEHICLE} conductores asociados.`
    );
  }
  return ok();
}

// ── Validación compuesta de creación ─────────────────────────────
/**
 * Valida todas las reglas de negocio antes de registrar un nuevo vehículo.
 * Devuelve el primer error encontrado o OK si todas pasan.
 *
 * @param driverCurrentVehicleCount - Cuántos vehículos tiene ya el conductor.
 * @returns VehicleValidationResult
 */
export function validateNewVehicleCreation(
  driverCurrentVehicleCount: number
): VehicleValidationResult {
  return validateDriverCanAddVehicle(driverCurrentVehicleCount);
}

// ── Consulta Supabase – helper de conteo ─────────────────────────
/**
 * Tipo de función para consultar el número de vehículos de un conductor
 * (inyectable para facilitar los tests sin dependencia de Supabase).
 */
export type VehicleCountFetcher = (driverId: string) => Promise<number>;

/**
 * Valida en tiempo real (con consulta a BD) si un conductor puede crear
 * un nuevo vehículo.
 *
 * @param driverId        - UUID del conductor en la tabla `users`.
 * @param fetchVehicleCount - Función que devuelve la cantidad actual de vehículos.
 * @returns Promise<VehicleValidationResult>
 */
export async function validateNewVehicleCreationAsync(
  driverId: string,
  fetchVehicleCount: VehicleCountFetcher
): Promise<VehicleValidationResult> {
  const count = await fetchVehicleCount(driverId);
  return validateNewVehicleCreation(count);
}

// ── Tipo de función para consultar conductores de un vehículo ────
export type DriverCountFetcher = (vehicleId: string) => Promise<number>;

/**
 * Valida en tiempo real si un vehículo puede aceptar un nuevo conductor.
 *
 * @param vehicleId         - UUID del vehículo en la tabla `cars`.
 * @param fetchDriverCount  - Función que devuelve la cantidad actual de conductores.
 * @returns Promise<VehicleValidationResult>
 */
export async function validateNewDriverAssignmentAsync(
  vehicleId: string,
  fetchDriverCount: DriverCountFetcher
): Promise<VehicleValidationResult> {
  const count = await fetchDriverCount(vehicleId);
  return validateVehicleCanAddDriver(count);
}
