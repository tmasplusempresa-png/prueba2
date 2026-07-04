[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/utils/vehicleRules](../README.md) / validateNewVehicleCreation

# Function: validateNewVehicleCreation()

> **validateNewVehicleCreation**(`driverCurrentVehicleCount`): [`VehicleValidationResult`](../interfaces/VehicleValidationResult.md)

Defined in: [common/utils/vehicleRules.ts:118](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/utils/vehicleRules.ts#L118)

Valida todas las reglas de negocio antes de registrar un nuevo vehículo.
Devuelve el primer error encontrado o OK si todas pasan.

## Parameters

### driverCurrentVehicleCount

`number`

Cuántos vehículos tiene ya el conductor.

## Returns

[`VehicleValidationResult`](../interfaces/VehicleValidationResult.md)

VehicleValidationResult
