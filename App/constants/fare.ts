/**
 * Constantes oficiales del modelo de tarifas TmasPlus.
 *
 * Alineadas con `Base para Agente T+Plus.xlsm` (Tabla Tarifas),
 * Agente/backendRemoto/src/domains/booking/tarifa/ y
 * AplicacionWebTmasplus/.../utils/fareConstants.ts.
 *
 * Cada concepto es un valor independiente. Si dos aplican (ej. aeropuerto +
 * programado), se SUMAN naturalmente en el subtotal. No se usa
 * `delta_aeropuerto_prog` pre-calculado: confunde y obliga a ramas
 * condicionales.
 */

export const DELTA_AEROPUERTO = 12_000; // viaje desde/hacia aeropuerto
export const DELTA_PROGRAMADO = 4_800;  // reserva programada (cualquier hora)
export const DELTA_PROTOCOLO = 5_000;   // servicio con protocolo

// Margen Erixon (plataforma) sobre el valor conductor → valor cliente.
// Usado SOLO para el PRONÓSTICO inicial (rango mínimo-máximo mostrado al
// cliente al cotizar/durante el viaje) — NO para el precio final al
// completar el servicio, ver `addActualsToBooking` en
// `common/other/sharedFunctions.ts`, que iguala cliente=conductor al
// finalizar sin este margen. Revertido a 0.25 el 2026-07-04 tras un primer
// intento fallido de apagarlo globalmente que rompió el rango del
// pronóstico — ver [[10-deuda-tecnica]] #35 y [[21-calculo-tarifa]].
export const MARGEN_CLIENTE = 0.25;

// Umbral default para clasificar urbano vs intermunicipal cuando la categoría
// no trae `umbral_intermunicipal_km` en BD.
export const DEFAULT_UMBRAL_INTERMUNICIPAL_KM = 29;
