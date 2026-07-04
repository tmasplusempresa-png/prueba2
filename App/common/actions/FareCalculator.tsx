/**
 * Fórmula alineada con la hoja "board" del Excel:
 *   precio = base_fare + (price_per_km × km) + (rate_per_hour × minutos)
 *            + delta_aeropuerto + delta_programado + protocolo + peajes + parqueadero
 *   total  = max(precio, min_fare)  →  redondeado al 100 más cercano por arriba
 *
 * NOTA: rate_per_hour es una tarifa POR MINUTO (columna "Rate_per_Hour" del Excel).
 *       El campo valor_hora (opcional) contiene la tarifa real por hora = rate_per_hour × 60.
 *
 * context:
 *   isAirport       - true si origen o destino es aeropuerto → suma delta_aeropuerto
 *   isScheduled     - true si el viaje es programado        → suma delta_aeropuerto_prog
 *   isProtocol      - true si aplica protocolo              → suma 5 000 fijo
 *   tollsTotal      - total de peajes (ya calculado)
 *   parking         - costo de parqueadero
 *   isIntermunicipal- true si distancia > 50 km → usa tarifas _inter
 */
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

  const pick = (urban: any, inter: any) =>
    isIntermunicipal && inter ? inter : urban;

  const ratePerUnitDistance = Math.round(
    parseFloat(pick(rateDetails.rate_per_unit_distance, rateDetails.rate_per_unit_distance_inter))
  );
  // rate_per_hour es tarifa por MINUTO (no por hora)
  const ratePerMinute = Math.round(
    parseFloat(pick(rateDetails.rate_per_hour, rateDetails.rate_per_hour_inter))
  );
  const baseFare = Math.round(
    parseFloat(pick(rateDetails.base_fare, rateDetails.base_fare_inter) || 0)
  );
  const minFare = Math.round(
    parseFloat(pick(rateDetails.min_fare, rateDetails.min_fare_inter) || 0)
  );
  const convenienceFees = Math.round(parseFloat(rateDetails.convenience_fees || 0));
  const deltaAeropuerto = Math.round(parseFloat(rateDetails.delta_aeropuerto || 0));
  const deltaProgramado = Math.round(parseFloat(rateDetails.delta_aeropuerto_prog || 0));

  if (
    isNaN(distance) || isNaN(time) || isNaN(ratePerUnitDistance) ||
    isNaN(ratePerMinute) || isNaN(baseFare) || isNaN(minFare) || isNaN(convenienceFees)
  ) {
    console.error('Invalid numeric value in FareCalculator:', {
      distance, time, ratePerUnitDistance, ratePerMinute, baseFare, minFare, convenienceFees,
    });
    return { totalCost: 0, grandTotal: 0, convenience_fees: 0 };
  }

  // time está en segundos; dividimos por 60 para obtener minutos
  let baseCalculated = Math.round(
    (ratePerUnitDistance * distance) + (ratePerMinute * (time / 60))
  );

  if (baseFare > 0) baseCalculated += baseFare;

  if (instructionData?.parcelTypeSelected) baseCalculated += instructionData.parcelTypeSelected.amount;
  if (instructionData?.optionSelected) baseCalculated += instructionData.optionSelected.amount;

  // Recargos leídos de car_types
  if (isAirport && deltaAeropuerto > 0) baseCalculated += deltaAeropuerto;
  // Programado: aeropuerto usa delta_aeropuerto_prog de BD; sin aeropuerto usa $4.000 fijo
  if (isScheduled) baseCalculated += isAirport ? deltaProgramado : 4_000;
  if (isProtocol) baseCalculated += 5000;
  if (tollsTotal > 0) baseCalculated += tollsTotal;
  if (parking > 0) baseCalculated += parking;

  // Aplicar cobro mínimo y redondear al 100 superior (ROUNDUP(-2) del Excel)
  // rawTotal se conserva sin redondear para calcular el precio cliente correctamente.
  const rawTotal = Math.max(baseCalculated, minFare);
  let total = Math.ceil(rawTotal / 100) * 100;

  let convenienceFee = 0;
  if (rateDetails.convenience_fee_type === 'flat') {
    convenienceFee = convenienceFees;
  } else {
    convenienceFee = Math.round((total * convenienceFees) / 100);
  }

  const grand = total + convenienceFee;
  // Precio cliente: se aplica el margen sobre el subtotal ANTES del ROUNDUP del conductor.
  // Usar rawTotal evita redondear doble (+$100 de error cuando suma no es múltiplo de 100).
  const clientTotal = Math.ceil(rawTotal * 1.25 / 100) * 100;

  return {
    totalCost: total,        // precio conductor
    grandTotal: grand,       // precio conductor + fee de conveniencia
    clientTotal,             // precio que paga el cliente final
    convenience_fees: Math.round(convenienceFee),
  };
};
