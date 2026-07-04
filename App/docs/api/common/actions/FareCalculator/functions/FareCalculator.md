[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/actions/FareCalculator](../README.md) / FareCalculator

# Function: FareCalculator()

> **FareCalculator**(`distance`, `time`, `rateDetails`, `instructionData`, `_decimal`, `context?`): \{ `totalCost`: `number`; `grandTotal`: `number`; `convenience_fees`: `number`; `clientTotal?`: `undefined`; \} \| \{ `totalCost`: `number`; `grandTotal`: `number`; `clientTotal`: `number`; `convenience_fees`: `number`; \}

Defined in: [common/actions/FareCalculator.tsx:18](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/actions/FareCalculator.tsx#L18)

Fórmula alineada con la hoja "board" del Excel:
  precio = base_fare + (price_per_km × km) + (rate_per_hour × minutos)
           + delta_aeropuerto + delta_programado + protocolo + peajes + parqueadero
  total  = max(precio, min_fare)  →  redondeado al 100 más cercano por arriba

NOTA: rate_per_hour es una tarifa POR MINUTO (columna "Rate_per_Hour" del Excel).
      El campo valor_hora (opcional) contiene la tarifa real por hora = rate_per_hour × 60.

context:
  isAirport       - true si origen o destino es aeropuerto → suma delta_aeropuerto
  isScheduled     - true si el viaje es programado        → suma delta_aeropuerto_prog
  isProtocol      - true si aplica protocolo              → suma 5 000 fijo
  tollsTotal      - total de peajes (ya calculado)
  parking         - costo de parqueadero
  isIntermunicipal- true si distancia > 50 km → usa tarifas _inter

## Parameters

### distance

`number`

### time

`number`

### rateDetails

`any`

### instructionData

`any`

### \_decimal

`number`

### context?

#### isAirport?

`boolean`

#### isScheduled?

`boolean`

#### isProtocol?

`boolean`

#### tollsTotal?

`number`

#### parking?

`number`

#### isIntermunicipal?

`boolean`

## Returns

\{ `totalCost`: `number`; `grandTotal`: `number`; `convenience_fees`: `number`; `clientTotal?`: `undefined`; \} \| \{ `totalCost`: `number`; `grandTotal`: `number`; `clientTotal`: `number`; `convenience_fees`: `number`; \}
