[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/utils/vehicleRules](../README.md) / validateNewDriverAssignmentAsync

# Function: validateNewDriverAssignmentAsync()

> **validateNewDriverAssignmentAsync**(`vehicleId`, `fetchDriverCount`): `Promise`\<[`VehicleValidationResult`](../interfaces/VehicleValidationResult.md)\>

Defined in: [common/utils/vehicleRules.ts:157](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/utils/vehicleRules.ts#L157)

Valida en tiempo real si un vehículo puede aceptar un nuevo conductor.

## Parameters

### vehicleId

`string`

UUID del vehículo en la tabla `cars`.

### fetchDriverCount

[`DriverCountFetcher`](../type-aliases/DriverCountFetcher.md)

Función que devuelve la cantidad actual de conductores.

## Returns

`Promise`\<[`VehicleValidationResult`](../interfaces/VehicleValidationResult.md)\>

Promise<VehicleValidationResult>
