[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/utils/vehicleRules](../README.md) / validateNewVehicleCreationAsync

# Function: validateNewVehicleCreationAsync()

> **validateNewVehicleCreationAsync**(`driverId`, `fetchVehicleCount`): `Promise`\<[`VehicleValidationResult`](../interfaces/VehicleValidationResult.md)\>

Defined in: [common/utils/vehicleRules.ts:139](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/utils/vehicleRules.ts#L139)

Valida en tiempo real (con consulta a BD) si un conductor puede crear
un nuevo vehículo.

## Parameters

### driverId

`string`

UUID del conductor en la tabla `users`.

### fetchVehicleCount

[`VehicleCountFetcher`](../type-aliases/VehicleCountFetcher.md)

Función que devuelve la cantidad actual de vehículos.

## Returns

`Promise`\<[`VehicleValidationResult`](../interfaces/VehicleValidationResult.md)\>

Promise<VehicleValidationResult>
