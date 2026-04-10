export const FareCalculator = (distance, time, rateDetails, instructionData, decimal) => {
    // Convertir los valores a números y validar que no sean NaN
    const ratePerUnitDistance = Math.round(parseFloat(rateDetails.rate_per_unit_distance));
    const ratePerHour = Math.round(parseFloat(rateDetails.rate_per_hour));
    const baseFare = Math.round(parseFloat(rateDetails.base_fare || 0));
    const minFare = Math.round(parseFloat(rateDetails.min_fare || 0));
    const convenienceFees = Math.round(parseFloat(rateDetails.convenience_fees || 0));
  
    if (
      isNaN(distance) || isNaN(time) || isNaN(ratePerUnitDistance) ||
      isNaN(ratePerHour) || isNaN(baseFare) || isNaN(minFare) || isNaN(convenienceFees)
    ) {
      console.error("Invalid numeric value in FareCalculator:", {
        distance,
        time,
        ratePerUnitDistance,
        ratePerHour,
        baseFare,
        minFare,
        convenienceFees
      });
      return {
        totalCost: 0,
        grandTotal: 0,
        convenience_fees: 0
      };
    }
  
    // Calcular el costo base basado en la distancia y el tiempo
    let baseCalculated = Math.round((ratePerUnitDistance * distance) + (ratePerHour * (time / 3600)));
    
    // Añadir la tarifa base si existe
    if (baseFare > 0) {
      baseCalculated += baseFare;
    }
  
    // Añadir costos adicionales si existen
    if (instructionData && instructionData.parcelTypeSelected) {
      baseCalculated += instructionData.parcelTypeSelected.amount;
    }
    if (instructionData && instructionData.optionSelected) {
      baseCalculated += instructionData.optionSelected.amount;
    }
  
    // Verificar si el costo total es mayor que la tarifa mínima
    let total = baseCalculated > minFare ? baseCalculated : minFare;
  
    // Calcular la tarifa de conveniencia
    let convenienceFee = 0;
    if (rateDetails.convenience_fee_type === 'flat') {
      convenienceFee = convenienceFees;
    } else {
      convenienceFee = Math.round((total * convenienceFees) / 100);
    }
  
    // Calcular el total final
    let grand = total + convenienceFee;
  
    // Redondear los resultados para asegurarnos de que sean enteros
    return {
      totalCost: Math.round(total),
      grandTotal: Math.round(grand),
      convenience_fees: Math.round(convenienceFee)
    };
  }