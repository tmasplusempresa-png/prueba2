[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useDriverCancellationWatcher](../README.md) / activeTripBookings

# Variable: activeTripBookings

> `const` **activeTripBookings**: `Set`\<`string`\>

Defined in: hooks/useDriverCancellationWatcher.ts:12

Bookings que están siendo mostrados ahora mismo por una ReservationTripScreen
montada. El watcher global ignora estos ids para no duplicar el modal: la
pantalla del viaje ya muestra su propio aviso y, además, navega de vuelta.
Es la coordinación determinista entre la Parte 1 (pantalla) y la Parte 2 (global).
