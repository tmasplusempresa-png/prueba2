/**
 * Fórmula alineada con la hoja "board" del Excel oficial y con los demás
 * canales (Agente/backendRemoto, AplicacionWebTmasplus, sistema_calculo).
 *
 *   total_conductor = ROUNDUP((base + km*precio_km + min*precio_min
 *                              + delta_aeropuerto + delta_programado
 *                              + delta_protocolo + peajes + parqueadero
 *                              + extras) / 100) * 100
 *   total_conductor = MAX(total_conductor, min_fare)     ← piso post-roundup
 *   valor_cliente   = ROUNDUP(total_conductor * 1.25 / 100) * 100   ← margen Erixon
 *
 * NOTA: la tarifa por minuto se deriva de `valor_hora / 60`. El campo legacy
 *       `rate_per_hour` (que en BD también representa precio/min) se mantiene
 *       como fallback únicamente.
 *
 * Conceptos independientes y aditivos. Si dos aplican (ej. aeropuerto +
 * programado), se SUMAN naturalmente en el subtotal — no hay columna BD
 * pre-sumada `delta_aeropuerto_prog`.
 *
 * context:
 *   isAirport       - true si origen o destino es aeropuerto (detección
 *                     Haversine recomendada vía common/utils/airports.ts).
 *   isScheduled     - true si el viaje es programado.
 *   isProtocol      - true si aplica protocolo.
 *   tollsTotal      - total de peajes (ya calculado).
 *   parking         - costo de parqueadero.
 *   isIntermunicipal- true si distancia > umbral (default 29 km) → usa tarifas _inter.
 */
import {
  DELTA_AEROPUERTO,
  DELTA_PROGRAMADO,
  DELTA_PROTOCOLO,
  MARGEN_CLIENTE,
} from '@/constants/fare';

export const FareCalculator = (
  distance: number,
  time: number,
  rateDetails: any,
  instructionData: any,
  _decimal: number,
  context: {
    isAirport?: boolean;
    isScheduled?: boolean;
    isProtocol?: boolean;
    tollsTotal?: number;
    parking?: number;
    isIntermunicipal?: boolean;
  } = {}
) => {
  const {
    isAirport = false,
    isScheduled = false,
    isProtocol = false,
    tollsTotal = 0,
    parking = 0,
    isIntermunicipal = false,
  } = context;

  // pick: si es intermunicipal y existe el valor inter (incluso 0 explícito),
  // usar inter. `!= null` cubre null/undefined; 0 legítimo no cae a urbano.
  const pick = (urban: any, inter: any) =>
    isIntermunicipal && inter != null ? inter : urban;

  const ratePerUnitDistance = Math.round(
    parseFloat(pick(rateDetails.rate_per_unit_distance, rateDetails.rate_per_unit_distance_inter))
  );

  // Precio por minuto: derivado de `valor_hora / 60` (fuente canónica). Si la
  // categoría no expone `valor_hora`, fallback a `rate_per_hour` legacy.
  // NO redondear aquí (alineado con AddBookingPage.tsx de la web, que usa el
  // float completo) — redondear antes de multiplicar por los minutos
  // introducía una divergencia de precio entre canales para categorías cuyo
  // valor_hora/60 no cae en un entero exacto (ej. XPlus: 666.667).
  const valorHora = parseFloat(rateDetails.valor_hora || 0);
  let ratePerMinute: number;
  if (valorHora > 0) {
    const ratePerMinuteUrban = valorHora / 60;
    ratePerMinute = isIntermunicipal ? ratePerMinuteUrban / 0.5 : ratePerMinuteUrban;
  } else {
    ratePerMinute = Math.round(
      parseFloat(pick(rateDetails.rate_per_hour, rateDetails.rate_per_hour_inter) || 0)
    );
  }

  const baseFare = Math.round(
    parseFloat(pick(rateDetails.base_fare, rateDetails.base_fare_inter) || 0)
  );
  const minFare = Math.round(
    parseFloat(pick(rateDetails.min_fare, rateDetails.min_fare_inter) || 0)
  );
  const convenienceFees = Math.round(parseFloat(rateDetails.convenience_fees || 0));

  if (minFare <= 0) {
    console.warn(
      '[FareCalculator] min_fare=0 o ausente para categoría',
      rateDetails.id ?? rateDetails.name
    );
  }

  if (
    isNaN(distance) || isNaN(time) || isNaN(ratePerUnitDistance) ||
    isNaN(ratePerMinute) || isNaN(baseFare) || isNaN(minFare) || isNaN(convenienceFees)
  ) {
    console.error('Invalid numeric value in FareCalculator:', {
      distance, time, ratePerUnitDistance, ratePerMinute, baseFare, minFare, convenienceFees,
    });
    return { totalCost: 0, grandTotal: 0, clientTotal: 0, convenience_fees: 0 };
  }

  // Componentes (time entra en segundos; convertir a minutos para precio/min)
  let sumaComponentes = Math.round(
    (ratePerUnitDistance * distance) + (ratePerMinute * (time / 60))
  );

  if (baseFare > 0) sumaComponentes += baseFare;

  if (instructionData?.parcelTypeSelected) sumaComponentes += instructionData.parcelTypeSelected.amount;
  if (instructionData?.optionSelected) sumaComponentes += instructionData.optionSelected.amount;

  // Recargos: conceptos independientes, aditivos. Si coinciden, suman naturalmente.
  if (isAirport) sumaComponentes += DELTA_AEROPUERTO;       // 12 000
  if (isScheduled) sumaComponentes += DELTA_PROGRAMADO;     //  4 800
  if (isProtocol) sumaComponentes += DELTA_PROTOCOLO;       //  5 000
  if (tollsTotal > 0) sumaComponentes += tollsTotal;
  if (parking > 0) sumaComponentes += parking;

  // ROUNDUP centena (Excel J25), luego aplicar piso min_fare.
  let totalConductor = Math.ceil(sumaComponentes / 100) * 100;
  if (totalConductor < minFare) totalConductor = minFare;

  // Margen Erixon sobre total_conductor (Tapa!F13-F14).
  const clientTotal = Math.ceil((totalConductor * (1 + MARGEN_CLIENTE)) / 100) * 100;

  // Convenience fee: 'flat' = literal; otro = porcentaje sobre total_conductor.
  let convenienceFee = 0;
  if (rateDetails.convenience_fee_type === 'flat') {
    convenienceFee = convenienceFees;
  } else {
    convenienceFee = Math.round((totalConductor * convenienceFees) / 100);
  }

  const grand = totalConductor + convenienceFee;

  return {
    totalCost: totalConductor,   // precio conductor (post-roundup, post-min)
    grandTotal: grand,           // precio conductor + fee de conveniencia
    clientTotal,                 // precio que paga el cliente final
    convenience_fees: Math.round(convenienceFee),
  };
};
