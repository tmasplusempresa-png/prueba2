[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/utils/vehicleRules](../README.md) / VEHICLE\_RULES

# Variable: VEHICLE\_RULES

> `const` **VEHICLE\_RULES**: `object`

Defined in: [common/utils/vehicleRules.ts:19](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/utils/vehicleRules.ts#L19)

vehicleRules.ts
─────────────────────────────────────────────────────────────────
Módulo de lógica de negocio pura para la gestión de vehículos y
conductores en T+Plus.

REGLAS DEL SISTEMA:
  R1 – Crear vehículo es OBLIGATORIO para operar como conductor.
  R2 – Cada conductor puede tener MÁXIMO 2 vehículos registrados.
  R3 – Cada vehículo puede estar asociado a MÁXIMO 3 conductores.

Todas las funciones son puras (sin efectos secundarios) para que
puedan probarse de forma determinista y usarse tanto en el cliente
como en Cloud Functions.
─────────────────────────────────────────────────────────────────

## Type Declaration

### MIN\_VEHICLES\_PER\_DRIVER

> `readonly` **MIN\_VEHICLES\_PER\_DRIVER**: `1` = `1`

Un conductor debe tener al menos un vehículo para operar.

### MAX\_VEHICLES\_PER\_DRIVER

> `readonly` **MAX\_VEHICLES\_PER\_DRIVER**: `2` = `2`

Límite máximo de vehículos que un conductor puede registrar.

### MAX\_DRIVERS\_PER\_VEHICLE

> `readonly` **MAX\_DRIVERS\_PER\_VEHICLE**: `3` = `3`

Límite máximo de conductores que pueden estar asociados a un vehículo.
