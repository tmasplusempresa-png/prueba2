# Bitácora de LLMWIKI_Movil (AplicacionMovilTmasplus)

> ⚠️ **Punto de corte 2026-07-04.** Todo lo que sigue abajo de esta línea es
> **historial heredado** de `LLMWIKITmasPlus/` (wiki original del workspace,
> cubría móvil + web) en el momento en que se creó esta copia reenfocada.
> Contiene entradas mixtas (algunas sobre `AplicacionWebTmasplus`, fuera del
> alcance de esta copia) — se dejaron intactas como contexto histórico, no
> se filtraron entrada por entrada. **Entradas nuevas de acá en adelante son
> propias de esta copia** y deben ser exclusivamente sobre
> `AplicacionMovilTmasplus`.

## 2026-07-10 (16) — "Conductor no ve servicios" — dato inconsistente cars.service_type vs features.carType, no bug de código

**Agente:** Claude Code (Opus 4.8)
Reporte del usuario: *"al conductor no le aparecen los servicios"*, pidiendo
descartar primero si algo se rompió con el fix del piso `min_fare` de esta
misma sesión (entrada 15). Confirmado que no: ese fix toca
`sharedFunctions.ts`/`bookingsSlice.ts`, sin relación con
`DriverReservationsScreen.tsx` ni con `cars`.

**Diagnóstico en vivo** (sin Metro corriendo, vía `adb logcat -d
ReactNativeJS:V` sobre los dos emuladores conectados) + consultas de solo
lectura a Supabase con `service_role` key (el `anon` key sin sesión no ve
nada por RLS — devuelve `[]`, no confundir con "no hay datos"):
- `[RESERVAS]`: 0 filas crudas — no había reservas programadas, comportamiento
  correcto, no bug.
- `[INMEDIATOS]`: 25 filas crudas, 0 tras filtrar. El booking `3B8ZJV`
  (`car_type=ConfortPlus`) tenía pickup a 0km exactos del conductor de prueba,
  sin conductor asignado, `status=PENDING` — pasaba 3 de 4 filtros, se caía en
  coincidencia de categoría.

**Causa raíz:** cuenta `demo conductor` (`fcc57421-...`) con
`cars.service_type="particular"` (→XPlus) pero `cars.features.carType=
"ConfortPlus"` — divergentes. `fetchActiveCarType()` prioriza `service_type`
por diseño (mismo patrón que cerró el ítem #31 de deuda técnica), así que el
conductor quedaba categorizado XPlus y nunca veía bookings ConfortPlus.

**Fix:** con confirmación explícita del usuario sobre cuál valor era el
correcto (ConfortPlus), `PATCH cars.service_type = 'servicio_especial'` en la
fila del driver de prueba. Verificado end-to-end vía logcat: `Total: 0` →
`Total: 1, PENDING: 1` tras el siguiente ciclo de refresco (30s).

Documentado en **[[10-deuda-tecnica]] ítem #34** (incluye la metodología de
diagnóstico con `adb logcat` + `service_role` reutilizable para casos
similares) y cross-linked con el ítem #31 (mismo patrón de causa).

## 2026-07-10 (15) — Piso al mínimo cotizado en el recálculo al finalizar viaje

**Agente:** Claude Code (Opus 4.8)
Regla de negocio del usuario: *"el valor calculado podrá ser mayor al valor
mínimo del rango, pero jamás menor a ese valor"*. El recálculo real al
finalizar (`addActualsToBooking`, `sharedFunctions.ts`) sobreescribía
`trip_cost` con el `totalCost` recalculado **sin piso** → un viaje corto (no se
llegó al destino) o una ruta real más barata dejaba el precio final por debajo
del mínimo cotizado al cliente. La dirección "más largo → sube" ya funcionaba
(sesiones previas: `valor_hora`, columna `timestamp`, formato `trip_end_time`);
faltaba el piso.

**Verificación histórica pedida por el usuario:** auditados los 4 commits sobre
`sharedFunctions.ts` (`1e70a9b`, `6f03388`, `b796ef6`, `1322504`) + `git log
-S"Math.max"` / `-G` sobre conceptos de piso. **El piso nunca existió** — hueco
desde el origen, no regresión. Por eso se **creó** el sistema.

**Implementado:** invariante `precio_final = max(recalculado, mínimo_cotizado)`
donde mínimo cotizado = `trip_cost`/`driver_share` con que entró la reserva.
Se floorean `trip_cost` y `driver_share`; si aplica el piso se conserva la
`convenience_fees` cotizada. `distance` conserva la real (registro honesto).
Idempotente. Documentado en **[[21-calculo-tarifa]]** §"Actualización
2026-07-10".

**Hueco relacionado sin cerrar (documentado):** viaje atascado en `STARTED` sin
completar no tiene timeout ni cierre forzado desde el móvil → no dispara
recálculo ni cobro. Requiere acción admin web o job de timeout (decisión de
negocio pendiente).

## 2026-07-09 (14) — Confirmación de pago del conductor no aparecía (endBooking tronaba por location)

**Agente:** Claude Code (Opus 4.8)
Reporte del usuario: al finalizar un viaje on-demand en efectivo no salía el
"modal de recibo de pago" (la confirmación *"¿recibiste el pago en efectivo?"*).

Diagnóstico: no era el modal (un `CustomAlert` en `PaymentDeais.tsx` →
`handleCashButton`, correcto y presente en HEAD). El flujo ni llegaba a la
pantalla Payment porque `endBooking` (`common/store/bookingsSlice.ts`) lanzaba
`"Driver location data is missing"` cuando `driverProfile.location`
(= `state.auth.user.location`) venía vacío (casi siempre; garantizado en
emulador sin GPS) → `finalizarReserva` caía al `catch` sin navegar.

Fix aplicado en `endBooking`: leer GPS en vivo
(`Location.getCurrentPositionAsync`) con fallback a Redux, igual que
`updateLocation`. Documentado en **[[10-deuda-tecnica]] #33** y
**[[06-flujos-negocio]] §5.1** (nueva sección sobre la confirmación del
conductor). Se confirmó que el sistema NO fue eliminado por versiones recientes;
el commit `f11c7a6` había cerrado un bug distinto del mismo flujo (gate
`usertype` → `!isCustomer`).

## 2026-07-04 (13) — 2 bugs reales cerrados durante debug remoto + confirmación onMapReady

**Agente:** Claude Code (Sonnet 5)
Con logs `[GO-DEBUG]` ya fluyendo (problema de conexión Metro resuelto tras
reinstalar correctamente el paquete en el emulador correcto), traza completa
al presionar GO confirmó: `toggleDriverOnline` corre de punta a punta sin
excepción, TTS arranca, `MapSensor` monta (`onLayout` dispara) pero
**`onMapReady` nunca aparece** — confirma que el blanco de GO es la
superficie nativa de Maps que no termina de inicializar, no un crash JS.
Persiste igual en API 35 estable (antes se sospechaba del pre-release
API 36) — descarta esa hipótesis, apunta a límite de emulador/GPU más
profundo, no resuelto aún.

Dos bugs reales encontrados y cerrados en el camino:

- **[[10-deuda-tecnica]] #31**: `DriverReservationsScreen.tsx` tenía tabla
  de alias de categoría duplicada e incompleta (le faltaba
  `"servicio_especial"`, valor real del registro web) — causaba que
  conductores con esa categoría nunca vieran reservas. Reemplazado por
  `common/utils/carType.ts` (`toCanonicalCarType`), ya existente y completo.
- **[[10-deuda-tecnica]] #32**: botón "atrás" en header de mapa no hacía
  nada para conductores (`if (!isDriverView) ...` nunca se cumplía). Ahora
  usa `navigation.goBack()`.

También diagnosticado (sin fix): GPS fake del emulador apuntaba a Mountain
View, California — bookings de prueba en Colombia, fuera del radio de 3km
(`IMMEDIATE_RANGE_KM`). Config de emulador, no código.

Pendiente: overlay visual "Aceptar" superpuesto sobre header — no
reproducido de forma aislada, requiere captura completa para diagnosticar.

## 2026-07-04 (12) — Debug emulador Mac Apple Silicon: mapa en blanco + OOM

**Agente:** Claude Code (Sonnet 5)
Tras destrabar el bug del flag (#29), conductor llegó por primera vez a la
pantalla con `<MapSensor>` (Google Maps) y encontró 2 problemas ambientales
nuevos, no relacionados al código de negocio:

1. Mapa en blanco (`OpenGLRenderer: Unable to match the desired swap
   behavior`) — conocido en emuladores Android sobre Apple Silicon,
   agravado posiblemente por el pitch 3D (`syncCamera` en
   `mapaSensors.tsx` hardcodea `pitch:68` y pisa cualquier valor de
   `initialCamera` casi al instante — un diagnóstico previo que solo tocó
   `initialCamera` no probó realmente pitch:0, conclusión "no es el pitch"
   queda sin confirmar).
2. `OutOfMemoryError` en `ExpoRequestCdpInterceptor` (inspector de red de
   Expo dev-tools) — agravado por el polling nuevo (`fetchHomeImmediateBookings`
   cada 7s) + logs de diagnóstico de la sesión (11), con VM heap del AVD en
   256MB (default).

Documentada config de AVD recomendada en [[03-app-movil]] §Emulador Android
en Mac Apple Silicon: Pixel 8/9 Pro, API 35, Google Play, arm64-v8a,
Graphics=Hardware, RAM 4096MB, **VM heap ≥512MB**. Pendiente confirmar si
resuelve el mapa en blanco, y si el bug real de `syncCamera` pisando
`initialCamera` necesita arreglo de código aparte.

## 2026-07-04 (11) — Auditoría de páginas móvil vs código real + hallazgo sistémico

**Agente:** Claude Code (Sonnet 5)
**Trigger:** usuario pidió analizar `AplicacionMovilTmasplus` y actualizar la
wiki si era necesario, tras preguntar si documentación vieja del repo era
mala/causaba ruido (no había afirmado eso antes en esta sesión, pero la
auditoría confirmó el riesgo es real).

Delegado a subagente Explore: comparar 7 páginas (03, 06, 11, 12, 13, 17, 20)
contra el código actual. Hallazgos aplicados:

- `13-servicio-driver-tracking.md`: firma de `getEstimatedTime` documentada
  mal (3 params vs 5 reales). Corregido.
- `17-esquema-bookings.md`: reescrita — `booking_tracking` documentaba
  columnas `speed`/`heading`/`timestamp` que **no existen** (reales:
  `accuracy`/`created_at`/`updated_at`); enum de `status` le faltaban
  `PENDING`/`REACHED`; nota sobre columna `customer` vs `customer_id`
  corregida (existen AMBAS, no es "una está mal"); agregado
  `min_fare_snapshot` y trigger `calculate_total_cost` actualizados (sesión
  previa).
- `20-realtime-channels.md`: confirmado (no solo sospechado) que
  `BookingRealtimeService` y `DriverTrackingService` usan nombres de canal
  literalmente distintos (`tracking-` vs `tracking_`) — son 2 suscripciones
  independientes al mismo evento, no una compartida.

**Hallazgo sistémico mayor:** 48 referencias a `App/sql/*.sql` en 15 páginas
de la wiki — esa carpeta **nunca existió** en el repo (la única fuente real
de esquema es `App/supabase/BBDDRemota.sql`, un dump plano sin migraciones
versionadas). Cualquier dato citado solo desde un `App/sql/*` fantasma es
no-verificado, potencialmente una alucinación coherente nunca chequeada.
Documentado en [[10-deuda-tecnica]] #30. **No se reconciliaron las 13
páginas restantes en esta sesión** (alcance grande) — priorizar
`18-esquema-users-rls.md` (8 refs) y `19-esquema-memberships.md` (7 refs) en
una próxima pasada.

## 2026-07-04 (10) — Fix: conductor no veía ningún servicio inmediato (flag apagado)

**Agente:** Claude Code (Sonnet 5)
**Trigger:** usuario probando en 2 emuladores (fake GPS, cliente + conductor)
reportó que ningún servicio solicitado le aparecía al conductor, sin importar
tipo de vehículo ni ubicación.

Causa: `App/app/(tabs)/index.tsx:897` — `ENABLE_DRIVER_MAP_RESERVATIONS =
false` hardcodeado. `bookingModalDecline` (controla el modal con
aceptar/rechazar) solo se activa dentro de un efecto gateado por este flag.
Con `false`, el modal nunca se mostraba — aunque `filteredBookings`
(suscripción realtime a Supabase + filtro por carType/distancia, líneas
595-664) seguía funcionando de forma independiente y encontrando reservas
válidas. El bug no era de matching ni ubicación — el modal jamás se abría.

**Fix:** flag cambiado a `true`. Agregados logs de diagnóstico
(`console.log`/`warn` prefijo `[DRIVER-FEED]`) en `applyFilter`: cantidad de
bookings desde Supabase, motivo de descarte por booking, alerta si
`carType` difiere solo por mayúsculas/espacios, y confirmación de eventos
realtime INSERT recibidos.

**Riesgo secundario documentado, no confirmado:** el filtro usa `===`
estricto para `carType` sin normalizar — `DriverReservationsScreen.tsx` ya
tiene un helper `normalizeCarType` para esta misma divergencia histórica
documentada (nombre categoría conductor vs `car_types.name`), pero este
filtro no lo usa. Vigilar con los logs nuevos; portar el helper si aparece.

Detalle en [[10-deuda-tecnica]] #29. Pendiente: usuario debe recargar la app
y confirmar en el emulador que el servicio ahora sí aparece al conductor.

## 2026-07-04 (9) — Auditoría de redondeo: 1 bug de fórmula + 2 bugs de pantalla corregidos

**Agente:** Claude Code (Sonnet 5)
**Trigger:** usuario pidió validar redondeo de precio/rango estimado, tanto
al crear la reserva como al finalizar el servicio. Durante la validación,
usuario reportó nueva divergencia con TaxiPlus: web $108.700–$135.900, móvil
$108.600–$135.800 (gap de $100 en ambos extremos).

### Motor central (`FareCalculator`) — verificado correcto
ROUNDUP-100 → piso `min_fare` (sin re-redondear) → margen ceil-100. Idéntico
a la web. El piso `min_fare` no siendo múltiplo de 100 (ej. TaxiPlus=$8.880)
es comportamiento esperado, no bug.

### Bug de fórmula corregido
`FareCalculator.tsx`: `ratePerMinute` se redondeaba (`Math.round`) antes de
multiplicar por los minutos; la web nunca redondea ese intermedio. Para
categorías con `valor_hora/60` no entero (ej. XPlus `666.667`), esto podía
divergir de la web dependiendo de si cruzaba el límite de ROUNDUP-100. Quitado
el `Math.round` prematuro.

### Bugs de pantalla corregidos (no afectan lo cobrado/persistido, solo el display)
- `BookingCabScren.tsx:2282-2286` (pantalla "esperando conductor", activa):
  mostraba rango `trip_cost` a `trip_cost + $7.000 fijo`, sin relación al
  margen real 25%. Corregido a usar `estimate` (clientFare real).
- `BookingsView.tsx` (lista de solicitudes del conductor, `index.tsx:3125`,
  activa): **bug severo** — `roundPrice(calculateEstimatedCost(...))` pasaba
  un string a una función que espera número → renderizaba `NaN` en pantalla,
  el conductor veía "NaN" como costo estimado. Además fabricaba rango con
  +30%/+$5.000 "hora pico" inventado, y clasificaba urbano/intermunicipal con
  bounding-box hardcodeado a Bogotá (mal-clasificaba cualquier otra ciudad).
  Corregido: rango real (`trip_cost`/`estimate`), clasificación por
  `distancia > umbral_intermunicipal_km` sin bounding-box.

### Documentado, no corregido
- `hooks/roundPrice.ts` (redondeo a $50, display-only) duplica el redondeo
  del motor en 4 pantallas — inocuo salvo cuando `min_fare` no es múltiplo de
  100 (desfase cosmético ≤$100). Bajo impacto, no tocado.
- El gap de $100 en TaxiPlus **no** es el bug de `ratePerMinute` (su
  `valor_hora/60/0.5=852` ya es entero exacto) — es ruido de dos llamadas
  independientes a Mapbox Directions en momentos distintos. No corregible sin
  compartir una única fuente de ruta entre canales. Documentado como
  tolerancia esperada (~$100-200).

Detalle completo en [[21-calculo-tarifa]] §Actualización 2026-07-04 (4).

## 2026-07-04 (8) — Fix bug real: `valor_hora` no llegaba a `FareCalculator` (3 de 4 callers móviles)

**Agente:** Claude Code (Sonnet 5)
Tras unificar distancia/tiempo a Mapbox (sesión 7), usuario reprodujo la
prueba (XPlus, intermunicipal, aeropuerto, 35.3km/57min) con distancia/tiempo
ya idénticos entre web y móvil, pero el precio seguía divergiendo
($60.900–$76.200 web vs $57.100–$71.400 móvil). Descartado stale-cache
(usuario refrescó la app, mismo resultado). Usuario aportó valores reales de
`car_types` (TaxiPlus y XPlus) que permitieron verificar la fórmula web
componente por componente — exacta.

Causa real encontrada: `FareCalculator.tsx` deriva el precio/minuto de
`valor_hora/60` (con doblado `/0.5` si intermunicipal); si `valor_hora` no
llega, cae a un fallback legacy (`rate_per_hour_inter` directo, sin doblado).
3 de 4 lugares que arman el objeto de tarifas para `FareCalculator` no
copiaban `valor_hora`:
- `CreateReservationScreen.tsx` — ni siquiera estaba en el `.select(...)` de Supabase.
- `sharedFunctions.ts` (`addActualsToBooking`, recálculo al finalizar viaje) — el select traía la columna (`select('*')`) pero el mapeo manual no la copiaba.
- `CarDetails.tsx` — mismo patrón (componente inerte, [[10-deuda-tecnica]] #28, sin impacto real pero corregido por higiene).

`BookingScreen.tsx` (reserva inmediata) sí lo hacía bien — por eso la primera
prueba de esta sesión (TaxiPlus, vía esa pantalla) había coincidido con la web.

**Fix:** agregado `valor_hora` al select + al objeto de tarifas mapeado en
los 3 archivos. `DEFAULT_VEHICLE_RATES` (fallback offline hardcodeado,
`CreateReservationScreen.tsx:46-50`) se dejó sin tocar a propósito — solo se
usa si Supabase no responde.

**✅ Verificado por el usuario en emulador**: mismo viaje (XPlus,
intermunicipal, aeropuerto, 35.3km/57min) ahora da $60.900–$76.200 en móvil,
idéntico a la web. Divergencia cerrada end-to-end (ruteo unificado + fórmula
alineada). Detalle en [[21-calculo-tarifa]] §Actualización 2026-07-04 (3).

## 2026-07-04 (7) — Diagnóstico y fix: divergencia de precio web vs móvil (proveedor de ruteo)

**Agente:** Claude Code (Sonnet 5)
**Trigger:** usuario reportó mismo viaje (Itagüí→Aeropuerto Rionegro,
intermunicipal+aeropuerto+TaxiPlus) con precios muy distintos entre web
($93.700–$117.200) y móvil ($108.600–$135.800).

Verificado numéricamente que `FareCalculator` es idéntico en ambos canales —
retro-derivé las tarifas reales de TaxiPlus desde el desglose web y las
apliqué sobre la distancia/tiempo del móvil: el resultado coincide (±$300-400
de redondeo). La causa real: web usa `google.maps.DirectionsService` (31km/
45min) y móvil usa Mapbox Directions (35km/57min) — proveedores distintos
eligiendo rutas físicas distintas para el mismo origen-destino.

**Decisión del usuario:** unificar a Mapbox en ambos canales (móvil ya lo
usa extensivamente para mapa+tracking; menos invasivo migrar solo la web).

**Fix aplicado:** `AplicacionWebTmasplus/TmasPlus_webSite/src/components/maps/GoogleMapsAddressPicker.tsx`
— componente `Directions` migrado de `google.maps.DirectionsService` a fetch
directo a Mapbox Directions API (mismo endpoint que usa el móvil). El mapa
base sigue siendo Google Maps (autocompletar, marcadores); la ruta se dibuja
ahora con `google.maps.Polyline` manual sobre las coordenadas que devuelve
Mapbox. Requiere que el usuario complete `VITE_MAPBOX_ACCESS_TOKEN` en
`.env` del proyecto web (la variable ya estaba reservada en `.env.example`,
sin valor real puesto).

**backendRemoto (OSRM) queda fuera de esta unificación** — cuarto proveedor
de ruteo en el ecosistema, no tocado, documentado en [[26-comparativa-canales-pricing]].

Detalle completo en [[26-comparativa-canales-pricing]] §Divergencia real
detectada 2026-07-04.

## 2026-07-04 (6) — Bug bloqueante encontrado preparando pruebas manuales: `addActualsToBooking` nunca leía tracking

Al diseñar el plan de prueba manual (emulador remoto, desvío A→C→B) para el
fix de la sesión (3), se detectó que `addActualsToBooking` consultaba
`booking_tracking` pidiendo `select('lat, lng, timestamp')` / `order('timestamp')`
— columna que no existe en la tabla (solo `created_at`/`updated_at`). El error
de PostgREST no se chequeaba, así que la función siempre devolvía
`distance=0`, `coords=[]` **sin ningún error visible**, invalidando
silenciosamente el fix completo de la sesión (3) para cualquier canal.

**Fix:** `App/common/other/sharedFunctions.ts` — cambiado a
`select('lat, lng, created_at')` + `order('created_at')`, y agregado log de
error explícito si la consulta falla. Documentado en [[21-calculo-tarifa]].

Pendiente: usuario va a probar manualmente en emulador remoto (no se puede
correr ni controlar ese emulador desde este entorno). Se le propuso un
script de "seed" de `booking_tracking` para simular el desvío sin necesidad
de GPS real — no escrito aún, a definir según lo que necesite.

## 2026-07-04 (5) — #26 pospuesto por decisión de usuario; código revertido

**Agente:** Claude Code (Sonnet 5)
Se iba a implementar #26 (snapshot `is_protocol`/`tolls_total`/`parking_cost`
en `bookings`). Usuario clarificó que su reporte original (desvío A→C→B con
espera) **ya estaba resuelto por el fix de la sesión (3)** — #26 es un
problema distinto (recargos fijos, no distancia/tiempo) y decidió posponerlo.

Se revirtieron los cambios parciales hechos antes de aplicar cualquier SQL:
- `App/common/actions/saveBooking.ts`: quitado mapeo `tolls_total`/
  `is_protocol`/`parking_cost` (habría roto el INSERT — esas columnas no
  existen en BD, PostgREST rechaza columnas desconocidas).
- `App/app/(tabs)/ReservationTripScreen.tsx`: revertido `completeTrip()` a
  pasar solo `{ isScheduled: true }` a `addActualsToBooking` (sin los 3
  campos que no existen aún).
- `App/common/store/bookingsSlice.ts`: edición propuesta fue rechazada por el
  usuario antes de aplicarse — sin cambios.

**Sin cambios de BD.** Verificado además que hoy ninguna UI móvil setea estos
3 flags realmente (no es bug de pérdida de datos activo, es deuda
prospectiva). Plan de cierre completo documentado en [[10-deuda-tecnica]] #26
para cuando se retome.

## 2026-07-04 (4) — Cierre #27: `REACHED` faltaba del constraint de `bookings.status`

**Agente:** Claude Code (Sonnet 5)
Verificado contra BD real (`pg_get_constraintdef`) que el constraint
`bookings_status_check` no incluía `REACHED` — no era dump desactualizado,
bug real activo (13 archivos escriben ese status, updates fallaban
silenciosos por try/catch en cada callsite). Usuario ejecutó:
```sql
ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status::text = ANY (ARRAY['NEW','PENDING','ACCEPTED','STARTED',
    'ARRIVED','REACHED','COMPLETE','PAID','CANCELLED']::text[]));
```
Cerrado en [[10-deuda-tecnica]] #27. Pendiente operacional (no en este
alcance): auditar reservas históricas atascadas en `STARTED` por el bug.

## 2026-07-04 (3) — Fix bug "no recalcula precio/ruta real al finalizar reserva" + min_fare_snapshot

**Agente:** Claude Code (Sonnet 5)
**Trigger:** usuario reportó que un desvío durante un viaje reservado (recogida
adicional en punto C) no aumenta el precio final ni guarda la ruta real
recorrida al llegar al punto B.

### Diagnóstico confirmado
`ReservationTripScreen.tsx completeTrip()` solo hacía PATCH de status —
nunca recalculaba. `addActualsToBooking` (`sharedFunctions.ts`) ya existe y
recalcula distancia real (Haversine sobre `booking_tracking`, incluye
desvíos) + precio (`FareCalculator`) + guarda ruta (`coords`), pero nadie la
llamaba desde esta pantalla.

### Bug bloqueante encontrado durante la implementación
`addActualsToBooking` escribía `trip_end_time` como string `"H:M:S"` sin
padding ni fecha — inválido para la columna `timestamp with time zone`. El
UPDATE a Supabase habría fallado silenciosamente (atrapado por su propio
try/catch), inutilizando el fix aunque el resto de la lógica fuera correcta.
Corregido a `.toISOString()`.

### Cambios de código
- `App/common/other/sharedFunctions.ts`: `addActualsToBooking` ahora acepta
  segundo parámetro opcional `extraFareContext` (`isScheduled`, `isProtocol`,
  `tollsTotal`, `parking`) y lo pasa a `FareCalculator`. Fix `trip_end_time`
  a ISO. Compatible con las 2 llamadas existentes (`bookingsSlice.ts`,
  `bookinglistactions.ts` — este último confirmado código muerto, sin
  importadores).
- `App/app/(tabs)/ReservationTripScreen.tsx`: `completeTrip()` ahora llama
  `addActualsToBooking(bookingForActuals, { isScheduled: true })` en vez de
  solo actualizar status. Agregado `tripStartTimestamp` (ref, ms epoch) fijado
  en `handleStartTrip`, insumo de `total_trip_time`.
- `App/common/other/GeoFunctions.ts`: typo `'ACCPETED'` → `'ACCEPTED'` en
  `GetTripDistance` (sin efecto funcional hoy — `addActualsToBooking` fuerza
  `status:'STARTED'` en todos los puntos sintéticos antes de filtrar; fix por
  higiene ante futuros llamadores con status real).
- `App/app/(tabs)/BookingScreen.tsx`: agregado `min_fare_snapshot:
  selectedVehicle?.min_fare` al objeto `pendingBookingRef` (reserva inmediata).
- `App/common/actions/saveBooking.ts`: mapeo `min_fare_snapshot` al insert.
- `App/app/(tabs)/CreateReservationScreen.tsx`: agregado `min_fare_snapshot:
  vehicleRates[carType].min_fare` al insert. **Hallazgo adicional:** este
  insert nunca seteaba `trip_cost` (solo `driver_share`/`price`/`estimate`) —
  agregado `trip_cost: driverPrice`.

### Migración SQL — APLICADA en BD remota 2026-07-04
Usuario confirmó `pg_get_functiondef('public.calculate_total_cost')` antes de
reemplazar: cuerpo real coincidía 1:1 con lo asumido (sin lógica oculta
adicional). Ejecutado por el usuario en Supabase:
1. `ALTER TABLE bookings ADD COLUMN min_fare_snapshot numeric(10,2)`.
2. `calculate_total_cost()` reemplazada con piso
   `GREATEST(trip_cost+fees-discount, min_fare_snapshot)`.

No versionado como archivo `.sql` en el repo — no existe carpeta `App/sql/`
(la mencionada en [[22-plan-fix-bug-min-fare]] nunca se creó; solo
`App/supabase/BBDDRemota.sql` como dump de referencia, ahora desactualizado
respecto a estos 2 cambios).

### Deuda técnica documentada, no cerrada (ver [[10-deuda-tecnica]] #26, #27)
- #26: `addActualsToBooking` no puede reconstruir protocolo/peajes/parqueadero
  al recalcular (no hay columnas snapshot en `bookings`).
- #27: constraint `bookings_status_check` en el dump no incluye `'REACHED'`
  pese a uso activo en 13 archivos — sospecha de dump desactualizado, pendiente
  confirmar contra BD real antes de decidir si requiere migración.

## 2026-07-04 (2) — Corrección algoritmo tarifa móvil + bug flujo "Reservar"

**Agente:** Claude Code (Sonnet 5)
**Trigger:** usuario pidió verificar si wiki refleja correctamente el cálculo de tarifa aplicado en `AplicacionMovilTmasplus`, y si el propio código está internamente alineado.

### Hallazgo
- `21-calculo-tarifa.md` cuerpo principal (secciones Inputs/Columnas/Algoritmo) describía el algoritmo **previo** al refactor "Actualización 2026-06-27" — quedó desactualizado respecto al propio apéndice del mismo documento y al código real (`FareCalculator.tsx`).
- Bug real no documentado: botón "Reservar" en `BookingScreen.tsx` (~línea 1303-1309) no usaba `FareCalculator` — sumaba `delta_aeropuerto`/`delta_aeropuerto_prog` de BD (columnas vestigiales) encima de `fareDetails.estimateFare` que YA incluía esos recargos vía constantes. Doble cobro + sin piso `min_fare` + redondeo `/0.8` distinto al resto del algoritmo.

### Cambios en `21-calculo-tarifa.md`
- Reescritas secciones `context`, `Columnas de car_types consumidas`, `Selección urbana vs intermunicipal`, `Algoritmo paso a paso` para reflejar código actual (constantes fijas, pick() con `!= null`, ROUNDUP→min_fare→margen post-roundup).
- Documentado comportamiento no descrito antes: precio/min duplicado (`/0.5`) en intermunicipal vía `valor_hora`.
- Actualizada tabla "Constantes hardcodeadas" y fila Aeropuerto en "Discrepancias entre canales".
- Añadida sección "Actualización 2026-07-04 — Bug: flujo Reservar duplicaba recargos" documentando el bug y el fix.

### Cambio en código
- `App/app/(tabs)/BookingScreen.tsx` (~línea 1303-1319): botón "Reservar" ahora llama `FareCalculator` directo (multiplicando distancia/tiempo por `mult` de Ida y Vuelta antes de la llamada), igual que `getVehiclePrice`. Elimina doble conteo de recargos, aplica piso `min_fare` y margen correcto.

## 2026-07-04 — Sync wiki con código actual

**Agente:** OpenCode (big-pickle)
**Trigger:** usuario solicitó contrastar wiki vs copia limpia de `AplicacionMovilTmasplus`.

### Cambios en `03-app-movil.md`
- Estructura: añadidos `register-driver.tsx`, `AuthLoadingScreen.tsx`, `+not-found.tsx`, `+html.tsx`.
- Componentes: 35 → ~40. Hooks: 21 → 22. Servicios: 14 → 15.
- Arranque `_layout.tsx`: añadidos `useDriverCarSync` y `DriverLocationDisclosureGate`.
- Slices Redux: añadidos `kilometers`, `authThunks`, `backgroundTask`, `permissions`, `types`.
- Servicios: añadido `backgroundLocationConsent.ts`.
- Hooks: añadidos `useDriverCarSync`, `useDriverCancellationWatcher`, `useDriverSignalHealth`, `useBookingRequestTimer`.
- Comandos: añadidos `npm run dev`, `npm run build`.
- Fuentes: reemplazada referencia muerta a `documentacion/ARQUITECTURA.md` por rutas reales del código.

### Cambios en `10-deuda-tecnica.md`
- Cerrado #16 (rate_per_hour → valor_hora/60 en móvil).
- Cerrado #18 (Δ aeropuerto 12k móvil+web).
- Cerrado #19 (aero+programado rama explícita).
- Cerrado #20 (Por Hora escala — no aplica a móvil).
- Cerrado #22 (auto-detección urbano↔intermunicipal).
- Cerrado #24 (web min_fare fix aplicado sesión 7).
- Cerrado parcial #25 (aeropuerto corregido; margen/protocolo/ROUNDUP pendientes).
- Fuentes: actualizadas (rutas rotas eliminadas).

## 2026-06-24 — Ingesta inicial

**Agente:** Claude Code (Opus 4.7)
**Alcance:** AplicaciónMovilTmasplus + AplicacionWebTmasplus
**Excluido:** Agente/ (tiene base independiente)

### Fuentes leídas
- `AplicaciónMovilTmasplus/documentacion/ARQUITECTURA.md` (329 líneas)
- `AplicacionWebTmasplus/TmasPlus_webSite/README.md`
- `AplicacionWebTmasplus/TmasPlus_webSite/docs/ARCHITECTURE.md`
- Listados de `src/services/`, `src/pages/` (web)
- Listados de `App/` y `App/documentacion/` (móvil)

### Páginas WIKI creadas
- `index.md`
- `01-arquitectura-general.md`
- `02-stack-tecnologico.md`
- `03-app-movil.md`
- `04-app-web-dashboard.md`
- `05-backend-supabase.md`
- `06-flujos-negocio.md`
- `07-entidades-bd.md`
- `08-servicios-externos.md`
- `09-cuentas-credenciales.md`
- `10-deuda-tecnica.md`

### Pendientes para próximas ingestas
- Compilar páginas individuales por servicio (`OtpService`, `BookingRealtimeService`, etc.).
- Compilar páginas por flujo (`flujo-otp`, `flujo-pago-daviplata`, `flujo-tracking`).
- Ingestar `docs/ENDPOINTS_Y_CONSULTAS.md` y `docs/POSTMAN_REST_API.md` (móvil).
- Ingestar `docs/DATABASE_SCHEMA.md`, `docs/WORKFLOWS.md`, `docs/API_DOCUMENTATION.md` (web).
- Pasar `sql/` (53 scripts) por extracción de esquema/RLS/RPC.

## 2026-06-24 (sesión 2) — Ingesta backend + servicios top

**Agente:** Claude Code (Opus 4.7)
**Alcance:** SQL real + ENDPOINTS_Y_CONSULTAS + 5 servicios móvil top.

### Fuentes leídas
- `App/documentacion/ENDPOINTS_Y_CONSULTAS.md` (245 líneas, doc oficial)
- `App/common/services/OtpService.ts` (130 líneas)
- `App/common/services/BookingRealtimeService.ts` (270 líneas)
- `App/common/services/DriverTrackingService.ts` (245 líneas)
- `App/common/services/membershipsService.ts` (parcial, primeras 120 líneas)
- `App/common/services/CallService.ts` (46 líneas)
- `App/sql/bookings-schema.sql` (428 líneas — esquema completo + RLS + triggers + vistas)
- `App/sql/EJECUTAR_PRIMERO_OTP_SETUP.sql`
- `App/sql/create-users-table-with-rls.sql` (parcial)
- `App/sql/create-memberships-table.sql` (parcial)
- Listado de `App/sql/` (53 scripts)

### Páginas WIKI creadas
- `11-servicio-otp.md`
- `12-servicio-booking-realtime.md`
- `13-servicio-driver-tracking.md`
- `14-servicio-memberships.md`
- `15-servicio-call.md`
- `16-rest-endpoints-rpc.md`
- `17-esquema-bookings.md`
- `18-esquema-users-rls.md`
- `19-esquema-memberships.md`
- `20-realtime-channels.md`

### Actualizadas
- `index.md` — sección Servicios y Backend.
- `10-deuda-tecnica.md` — añadidos ítems #9 a #14 (discrepancias doc↔schema).

### Hallazgos críticos (movidos a deuda técnica)
1. **`bookings.customer`/`driver`** (no `customer_id`/`driver_id` como dice doc).
2. **Estados reales**: `NEW, ACCEPTED, STARTED, ARRIVED, COMPLETE, PAID, CANCELLED`
   (no `COMPLETED`).
3. **`booking_tracking.lat`/`lng`** (no `latitude`/`longitude`/`timestamp_ms`).
4. **`users.user_type` admite `company`** además de cliente/conductor/admin.
5. **`memberships.conductor` FK a `auth.users`**, no `public.users` — rompe joins.
6. **Canal `tracking-*` duplicado** entre `BookingRealtimeService` y `DriverTrackingService`.
7. **OTP**: schema original VARCHAR(6), setup lo cambia a VARCHAR(4); servicio genera 4.

## 2026-06-25 — Cálculo tarifa (consulta dirigida)

**Trigger:** usuario preguntó cómo se calcula correctamente el servicio.

### Fuentes leídas
- `Agente/llm-wiki/01-WIKI/flujo-solicitud-servicio.md`
- `Agente/llm-wiki/00-RAW/tablasDeWhatsapp.md` (esquema `VehicleCategory`)
- `Agente/llm-wiki/01-WIKI/sistema-tools.md`
- `Agente/llm-wiki/01-WIKI/base-de-datos.md`
- `Agente/llm-wiki/02-LOG/2026-05-30-conocimiento-agente-ingesta-web.md`
- `App/common/actions/FareCalculator.tsx` (113 líneas — algoritmo completo)
- `App/components/CarDetails.tsx` (pipeline invocación, líneas 53-118)

### Página nueva
- `21-calculo-tarifa.md` — algoritmo paso a paso, constantes hardcoded,
  ejemplo numérico, discrepancias móvil↔WhatsApp.

### Deuda nueva
- #15 — fórmula duplicada entre canales móvil y WhatsApp (`car_types` vs `VehicleCategory`).
- #16 — `rate_per_hour` mal nombrada (es COP/minuto).

### Hallazgo
- Agente WhatsApp **no calcula tarifa por diseño**: muestra botón "Solicitar
  viaje" y delega al backend VPS, que debería replicar el algoritmo móvil.
- Backend VPS no está ingerido todavía — si calcula con otra fórmula, riesgo
  de divergencia de precio entre canales.

## 2026-06-26 — Auditoría bug "cliente paga < min_fare"

**Trigger:** usuario reportó servicios donde cliente paga menos que `min_fare`
de la categoría. Análisis exhaustivo del pipeline de cálculo.

### Fuentes leídas
- `App/common/actions/FareCalculator.tsx` (relectura)
- `App/common/actions/saveBooking.ts` (líneas 1-100)
- `App/app/(tabs)/BookingScreen.tsx` (líneas 500-892, focus en `pendingBookingRef` y `fareDetails`)
- `App/sql/bookings-schema.sql` (trigger `calculate_total_cost`)
- Grep exhaustivo de `estimate`, `fareDetails`, `discount` en BookingScreen
- Agente Explore especializado mapeó CarDetails, sharedFunctions, test-fare.js

### Página nueva
- `22-plan-fix-bug-min-fare.md` — plan completo: causa raíz + 7 fixes + tests + auditoría retroactiva.

### Hallazgos críticos
- 🔴 **BUG-1 causa raíz:** variable `estimate` no declarada en
  `BookingScreen.tsx:866` y `:877`. `parseFloat(undefined) = NaN → || 0 = 0`.
  Booking persiste `trip_cost=0`.
- 🔴 **BUG-2:** trigger SQL `calculate_total_cost` sin piso `min_fare`.
- 🔴 **BUG-3:** descuento promo se muestra en UI pero NO persiste en BD.
- ⚠️ Trampas: `pick()` falsy-check, `min_fare || 0` silencioso, umbral
  intermunicipal inconsistente (29/50 km en 4 lugares distintos).

### Decisión pendiente
- Política margen × 1.25: ¿comisión total / fee aparte / sin margen? Requiere
  revisar `Base para Agente T+Plus.xlsm` (raíz proyecto). En raíz aparece
  `Desarrolllo SpApW-Tplus0001.xlsx` — confirmar si es el mismo archivo.

### Acuerdos con usuario
- Scope: fix completo (7 fixes + tests + unificación umbral).
- Reservas históricas: solo identificar via SQL, sin ajuste contable automático.
- Implementación pendiente: usuario indicó "antes vamos a realizar otra cosa".

### Pendientes
- Ingestar Excel base T+Plus para confirmar política pricing.

## 2026-06-26 (sesión 4) — Ingesta auditoría Excel + sistema_calculo Python

**Trigger:** usuario pidió ingestar `Auditoria_Modelo_Tarifas_TPlus.md` (raíz) +
carpeta `sistema_calculo/` (raíz). Resuelve decisión arquitectónica pendiente
del plan [[22-plan-fix-bug-min-fare]].

### Fuentes leídas
- `C:/test/TmasPlus/Auditoria_Modelo_Tarifas_TPlus.md` (265 líneas — auditoría Excel completa fechada 2026-05-05)
- `C:/test/TmasPlus/sistema_calculo/tarifa_engine.py` (206 líneas — motor Python)
- `C:/test/TmasPlus/sistema_calculo/config.py` (constantes)
- `C:/test/TmasPlus/sistema_calculo/models.py` (dataclasses)
- `C:/test/TmasPlus/sistema_calculo/sql/001_schema.sql` (tabla `tarifas` con GENERATED columns)
- `C:/test/TmasPlus/sistema_calculo/sql/002_seed_tarifas.sql` (valores oficiales)
- `C:/test/TmasPlus/sistema_calculo/sql/003_functions.sql` (RPC `calcular_tarifa`)

### Páginas WIKI creadas
- `23-modelo-pricing-excel-oficial.md` — auditoría Excel paso a paso.
- `24-sistema-calculo-python.md` — implementación referencia Python.
- `25-rpc-calcular-tarifa.md` — RPC SQL canónica.
- `26-comparativa-canales-pricing.md` — matriz divergencias Excel/Python/RPC/Móvil + ejemplos numéricos.

### Actualizadas
- `22-plan-fix-bug-min-fare.md` — decisión arquitectónica resuelta (Opción C).
- `10-deuda-tecnica.md` — ítems #17 a #23 nuevos.
- `index.md` — sección Pricing reorganizada.

### Hallazgos críticos
- 🔴 **Excel NO aplica min_fare:** `F25` se calcula pero nunca se compara contra `SUM(F17:F24)`. Operador debería forzar piso a mano. **Replica el bug operacional reportado en cotizaciones humanas.**
- 🔴 **Δ Aeropuerto subcobra 2 000 COP** en Excel + Python + RPC (10 000 vs 12 000 oficial Tabla Tarifas). Móvil NO tiene este bug.
- 🔴 **Modo "Por Hora" cobra siempre 60 min** sin escalar duración real (Excel + Python + RPC).
- 🔴 **Ida y Vuelta sin efecto** en Excel/Python/RPC. Móvil sí aplica `mult=2`.
- 🔴 **Combinación aeropuerto + programado** ignora `delta_aeropuerto_prog=4 800` y suma `10 000+4 000=14 000` (los 3 canales digitales).
- ⚠️ Móvil aplica margen 25% sobre `rawTotal` (pre-roundup); Python/RPC sobre `total_conductor` (post-roundup). Hasta **100 COP de gap** por servicio en valores no múltiplos de 100.

### Decisión arquitectónica resuelta
**Opción C** (`trip_cost = total_conductor`, margen 25% = ganancia plataforma).
Confirmada por Excel `Tapa!F11..F14` + Python + RPC.

Política oficial:
```
total_conductor = ROUNDUP(componentes) con piso min_fare
cliente         = ROUNDUP(total_conductor × 1.25)
ingreso_erixon  = cliente - total_conductor
```

Comisiones empresariales son path separado (`es_empresarial=true`).

### Recomendación estratégica (futuro)
App móvil debería invocar `supabase.rpc('calcular_tarifa', ...)` y eliminar
`FareCalculator.tsx`. Una sola fuente de verdad para los 3 canales digitales.

### Pendientes
- Ingestar resto de `App/sql/` (47 scripts no leídos): tracking, plate RPC,

## 2026-06-26 (sesión 5) — Ingesta tarifa backendRemoto Agente

**Trigger:** usuario indicó que `Agente/backendRemoto` tiene decisiones de
cálculo relevantes. Revisión.

### Fuentes leídas
- `Agente/CLAUDE.md` (contexto arquitectónico)
- `Agente/backendRemoto/src/domains/booking/tarifa/engine.py` (143 líneas — algoritmo)
- `Agente/backendRemoto/src/domains/booking/tarifa/models.py` (113 líneas)
- `Agente/backendRemoto/src/domains/booking/tarifa/formatter.py` (60 líneas — WhatsApp render)
- Grep handlers: `service_selection.py`, `service_selected.py` (consumidores)

### Página WIKI creada
- `27-tarifa-backendremoto-agente.md` — implementación mejorada, cierre de bugs históricos.

### Actualizadas
- `26-comparativa-canales-pricing.md` — quinta implementación añadida + tabla de cierre + ranking de canales + acción estratégica revisada.
- `10-deuda-tecnica.md` — items #18, #19, #20, #22, #23 actualizados marcando qué canal cerró cada bug.
- `22-plan-fix-bug-min-fare.md` — precondición: portar mejoras backendRemoto a RPC SQL antes de migrar móvil.
- `index.md` — añadida página 27.

### Hallazgos
- backendRemoto **cierra 4 hallazgos críticos** de la auditoría:
  - ✅ Δ Aeropuerto lee BD (=12 000), no hardcode 10 000.
  - ✅ Combinación aeropuerto+programado usa `delta_aeropuerto_prog` (4 800).
  - ✅ Por Hora >1h escala con minutos reales.
  - ✅ Auto-deriva Urbano↔Intermunicipal a 29 km en el engine.
- Eliminó constante `INSURANCE=500` que causaba `F30=-500` en sistema_calculo.
- `Tarifa.from_db_row(row)` lee directo `VehicleCategory` con defaults sanos.
- Pendiente: Ida y Vuelta (móvil sí lo aplica, backendRemoto no).
- Pendiente: aclarar semántica de `tipo_servicio="PorHora"` ya que no afecta el cálculo en backendRemoto.

### Implicación estratégica
backendRemoto es hoy la implementación **más correcta** entre las 5. Antes de
migrar móvil a la RPC SQL `calcular_tarifa`, **portar el algoritmo de
backendRemoto a la RPC**. De lo contrario, móvil heredaría 4 bugs ya
resueltos.

Ranking actualizado de canales (mejor → peor):
1. backendRemoto (Agente WhatsApp)
2. App móvil (con BUG-1/2/3 pendientes del plan)
3. RPC SQL Supabase
4. Python sistema_calculo (raíz)
5. Excel `board`

### Pendientes
- Ingestar tabla `VehicleCategory` real desde BD remota agente.
- Documentar `WhatsApp ConversationEngine` + `Agent Gateway` que invocan al tarifa engine.

## 2026-06-27 — Auditoría tarifa Dashboard Web

**Trigger:** usuario pidió revisar si `AplicacionWebTmasplus` sufre el mismo bug del móvil antes de implementar.

### Fuentes leídas
- `AplicacionWebTmasplus/.../src/pages/AddBooking/AddBookingPage.tsx` líneas 130-291 (handleCalculate + handleSubmit)
- `AplicacionWebTmasplus/.../src/services/bookings.service.ts:152-220` (`BookingsService.create` payload)

### Página WIKI creada
- `28-tarifa-web-dashboard.md` — sexta implementación. Confirma bug + política propia divergente.

### Actualizadas
- `22-plan-fix-bug-min-fare.md` — scope ampliado: Fixes W-1 a W-6 específicos canal web. Archivos modificados ampliados a 13.
- `10-deuda-tecnica.md` — items #24 (bug web) y #25 (política propia divergente). Renumerado #23 a "Seis implementaciones".
- `index.md` — añadida página 28.

### Hallazgo crítico confirmado
- **Web SUFRE el mismo bug "cliente paga < min_fare"** por vector distinto:
  - Móvil: variable `estimate` no declarada → `trip_cost: undefined` → 0.
  - Web: payload NO incluye `trip_cost` → NULL → 0.
  - En ambos casos trigger SQL `calculate_total_cost` pisa `total_cost = convenience_fees`.
- **Más grave en web** porque admins generan facturas corporativas sub-cobradas conscientemente (calcularon precio, el sistema lo pisó).

### Política propia divergente del web
- ❌ NO aplica margen 25% retail
- ❌ NO aplica path empresarial completo (procesamiento/IVA/seguro/hosting/PayU)
- ✅ Split 80/20 conductor/plataforma sugiere intento empresarial simplificado
- Ida y Vuelta: `returnLeg = oneWay × 0.80` + `waiting = valor_hora × hours` (ÚNICA política, 4 distintas en la empresa)
- `delta_aeropuerto_prog` aplica a cualquier programación (Excel solo combinación aero+prog)
- Sin flag aeropuerto ni protocolo (UI no los expone)
- Sin ROUNDUP centena (Math.round entero)

### Ranking actualizado (6 canales)
1. backendRemoto (Agente WhatsApp) — más correcto
2. App móvil (con BUG-1/2/3 pendientes)
3. RPC SQL Supabase
4. Python sistema_calculo
5. **Web Dashboard** — bug confirmado + política divergente
6. Excel `board`

### Implicación operacional inmediata
Si admins crearon reservas corporativas desde `AddBookingPage` desde su deploy:
- Cada reserva facturó al cliente **solo la comisión** (~$500-1000) en lugar del precio cotizado en pantalla.
- Operaciones desconoce el monto real cobrado vs el mostrado al admin.
- Auditoría SQL retroactiva del plan móvil debe distinguir reservas creadas por admin (`payment_mode='cash'` + datos corp) vs cliente móvil.

### Próximos pasos según usuario
"Documenta esto, ahora lo implementamos" — confirmado. Plan [[22-plan-fix-bug-min-fare]] ampliado a 13 archivos cubriendo móvil + web. Pendiente: confirmar política web con operaciones (retail / empresarial / propia) antes de Fix W-3.

## 2026-06-27 (sesión 7) — Implementación fix WEB `/addbooking` (scope mínimo)

**Trigger:** usuario aprobó plan ExitPlanMode + pidió "implementemos la solución en el sitio web".

### Archivos editados (2)
- `AplicacionWebTmasplus/TmasPlus_webSite/src/services/bookings.service.ts:191-200` — añadido `trip_cost = max(0, total_cost - convenience_fees + discount)` al payload INSERT.
- `AplicacionWebTmasplus/TmasPlus_webSite/src/pages/AddBooking/AddBookingPage.tsx:162` — `schedulingSurcharge` de `cat.delta_aeropuerto_prog` (4 800) a `4000` plano.

### Verificación
- `npx tsc --noEmit` → exit 0, sin errores TS.
- Verificación end-to-end manual queda al usuario: levantar `npm run dev`, crear reserva en `/addbooking`, consultar SQL bookings reciente.

### Razón de la fórmula `trip_cost = total_cost - fees + discount`
Trigger BD: `total_cost = trip_cost + convenience_fees - discount`. Para que el `total_cost` final de BD coincida con el `fare` mostrado en pantalla (`fare = subtotal + convenience`), debe pasarse `trip_cost = fare - fees + discount`. Equivale a "subtotal antes del fee" que el trigger luego suma de vuelta.

Ejemplo: UI calcula `fare=15000` con `fees=500`, `discount=0`.
- Payload: `total_cost=15000, trip_cost=14500, fees=500, discount=0`.
- Trigger BD: `total_cost = 14500 + 500 - 0 = 15000` ✓ (coincide con UI).

Antes del fix: `trip_cost=NULL → 0`, trigger devolvía `total_cost = 0 + 500 - 0 = 500`. Cliente pagaba **solo la comisión**.

### Wiki actualizada
- `28-tarifa-web-dashboard.md` — añadida sección "Implementación 2026-06-27 — Cambios aplicados" con detalle de los 2 cambios + verificación end-to-end + pendientes NO cubiertos.

### Pendientes confirmados (no en esta tanda)
- BUG-W2 margen 25% retail (decisión política operaciones).
- BUG-W3 path empresarial completo (decisión política).
- TRAMPA-W2 UI flags aeropuerto + protocolo (diseño UX).
- Fix 2 trigger SQL con piso `min_fare` (migración Supabase remota, defensa en profundidad).
- TRAMPA-W4 ROUNDUP centena en web.
- Fix W-6 migrar a RPC compartida `calcular_tarifa` (estratégico).
- Fixes móvil (BUG-1/2/3 BookingScreen.tsx) — sesión separada.

### Riesgo conocido
Reservas web pre-fix tienen `total_cost ≈ convenience_fees`. Este fix NO retro-corrige. Auditoría SQL del plan distingue dichas reservas para reporte a operaciones.

## 2026-06-27 (sesión 8) — Detección automática aeropuerto en web

**Trigger:** usuario confirmó que web no calcula aeropuerto y propuso portar el sistema de `Agente/backendRemoto`.

### Archivos nuevos (2)
- `AplicacionWebTmasplus/TmasPlus_webSite/src/utils/airports.json` — 40 aeropuertos Colombia (copia exacta de `Agente/backendRemoto/src/shared/geo/airports.json`).
- `AplicacionWebTmasplus/TmasPlus_webSite/src/utils/airports.ts` — `haversineKm` + `isNearAirport(lat, lng, radius_km=1.0)`. Portado de `airports.py` + `haversine.py` del backendRemoto.

### Archivos editados (1)
- `src/pages/AddBooking/AddBookingPage.tsx`:
  - Import `isNearAirport`.
  - `fareBreakdown` añade `airportSurcharge` + `airportName`.
  - `handleCalculate` detecta aeropuerto por coords (origen o destino) y suma `cat.delta_aeropuerto` (12 000 BD).
  - `schedulingSurcharge` ahora rama explícita: aero+programado→`delta_aeropuerto_prog`, solo programado→4 000.
  - UI desglose añade línea "Aeropuerto (nombre)" cuando aplica.

### Verificación
- `npx tsc --noEmit` → exit 0.

### Por qué es genial (heredado de backendRemoto)
- **Cero UI nueva.** Admin no marca checkbox.
- **Cero costo runtime.** JSON cargado al import; bounding-box pre-filter descarta 95%+ aeropuertos antes de Haversine.
- **Mantenimiento simple.** Añadir/quitar aeropuertos = editar JSON. No toca código.
- **Sin falsos negativos.** Bbox 0.1° (~11 km) >> radio 1 km del aeropuerto.

### Hallazgos cerrados (parcial)
- ✅ TRAMPA-W2 aeropuerto — resuelto sin UI.
- ✅ TRAMPA-W1 `schedulingSurcharge` mal interpretado — rama explícita aero/no-aero.
- ✅ Deuda #18 para el canal web — usa `delta_aeropuerto` BD (12 000).

### Wiki actualizada
- `28-tarifa-web-dashboard.md` — sección "Implementación 2" con detalle del aeropuerto + comparativa antes/después.

## 2026-06-27 (sesión 9) — Implementación móvil: alineación al modelo canónico

**Trigger:** usuario confirmó fix web exitoso, pidió implementar lo mismo en móvil.

### Archivos editados (8) + nuevos (3)

**Nuevos:**
- `App/common/utils/airports.json` — 40 aeropuertos Colombia (copia de web).
- `App/common/utils/airports.ts` — `haversineKm` + `isNearAirport`.
- `App/constants/fare.ts` — constantes oficiales (`DELTA_AEROPUERTO=12000`, `DELTA_PROGRAMADO=4800`, `DELTA_PROTOCOLO=5000`, `MARGEN_CLIENTE=0.25`, `DEFAULT_UMBRAL_INTERMUNICIPAL_KM=29`).

**Editados:**
- `App/common/actions/FareCalculator.tsx` — refactor completo: `valor_hora/60`, `pick()` con `!= null`, conceptos independientes (sin rama aero+prog), min_fare post-roundup, margen sobre total_conductor, warn min_fare<=0.
- `App/app/(tabs)/BookingScreen.tsx` — helper `detectAirport()`, reemplaza 4× string-matching, **fix BUG-1**: `pendingBookingRef` ahora usa `fareDetails.estimateFare/totalCost/...` (antes variable `estimate` undefined). **Fix BUG-3**: persiste `discount`, `promo_applied`, `promo_code`, `promo_details`.
- `App/app/(tabs)/CreateReservationScreen.tsx` — `isNearAirport` reemplaza string-match.
- `App/app/(tabs)/TripPreviewScreen.tsx` — idem.
- `App/common/other/sharedFunctions.ts` — `isNearAirport` por coords (lat/lng del booking).
- `App/components/CarDetails.tsx` — añade prop `isAirport`, usa constante umbral.
- `App/scripts/test-fare.js` — constantes nuevas (DELTA_PROGRAMADO 4000→4800), conceptos independientes, min_fare post-roundup, margen sobre total post-min.

### Verificación
- `npx tsc --noEmit` — errores son preexistentes (strict + módulos antiguos sin tipos); mis cambios no introducen nuevos.
- `node scripts/test-fare.js` arranca REPL sin error sintáctico.

### Bugs cerrados
- ✅ BUG-1 móvil — `estimate` undefined eliminada.
- ✅ BUG-3 móvil — promo/discount persisten al ref.
- ✅ TRAMPA-1 — `pick()` con `!= null`.
- ✅ TRAMPA-3 — umbral unificado a 29 km en 4 ubicaciones.
- ✅ Deuda #16 — `rate_per_hour` reemplazado por `valor_hora/60`.
- ✅ Deuda #20 — `Por Hora` ya escalaba en móvil (no afecta).
- ✅ Deuda #22 (móvil) — aeropuerto Haversine reemplaza string-matching.

### Pendiente
- BUG-2 — trigger SQL con piso `min_fare` (migración Supabase compartida con web).
- Verificación end-to-end en device real (depende de build móvil que sigue con problemas Gradle/Mapbox token).
- Cambio operacional: $4000→$4800 programado sin aeropuerto = +$800 por reserva programada urbana. Avisar a operaciones.

## 2026-06-27 (sesión 10) — Web: "Total a cobrar" muestra mínimo del rango

**Trigger:** usuario indicó que UI mostraba el MÁXIMO como total; política real es cobrar el MÍNIMO al inicio y ajustar al finalizar servicio.

### Archivos editados (1)
- `AplicacionWebTmasplus/.../pages/AddBooking/AddBookingPage.tsx`:
  - UI "Total a cobrar" ahora muestra `fareBreakdown.totalConductor` (mínimo).
  - Añadida nota: "Cobro inicial estimado. Puede ajustarse al finalizar el servicio según la ruta real."
  - `handleSubmit` persiste `total_cost = minCharge`, `estimate = maxCharge`, `driver_share = minCharge`.
  - `convenience_fees` % calculado sobre `minCharge`, no `fare`.

### Verificación
- `npx tsc --noEmit` → exit 0.
- Persistencia coherente: trigger BD recalcula `total_cost = trip_cost + fees - discount = minCharge`.
- Rango UI sigue visible: `[totalConductor, valorCliente]`.

### Semántica alineada con backendRemoto
[[27-tarifa-backendremoto-agente]] expone `rango_min = total_conductor` y `rango_max = valor_cliente` al cliente WhatsApp. Web ahora usa la misma convención.

### Pendiente (futuro)
Cuando conductor cierra viaje, sistema debería recalcular con distancia/tiempo real GPS y actualizar `bookings.total_cost` dentro del rango `[min, max]`. Fuera del rango: validación admin.

### Wiki actualizada
- `28-tarifa-web-dashboard.md` — sección "Implementación 3" con detalle política + persistencia end-to-end.

## 2026-06-27 (sesión 11) — Móvil: cobro inicial = mínimo del rango

**Trigger:** usuario pidió portar la mejora web al móvil.

### Archivos editados (1)
- `AplicacionMovilTmasplus/App/app/(tabs)/BookingScreen.tsx`:
  - `pendingBookingRef.estimate = fd.clientFare` (máximo esperado, antes era mínimo + fee).
  - Nota UI cerca del precio ajustable: "Cobro inicial estimado. Puede ajustarse al finalizar el servicio. Rango: min – max".

### Estado móvil
Semánticamente ya estaba alineado: `getVehiclePrice` retorna `grandTotal` (mínimo + fee), no `clientFare` (máximo). Único ajuste: `estimate` persistido ahora refleja el máximo del rango como referencia superior.

### Verificación
- `npx tsc --noEmit` — sin errores nuevos en BookingScreen relacionados con los cambios.

### Cross-canal alineado
Los 3 canales exponen la misma semántica:
| Canal | Cobra | Estimación superior |
|-------|-------|---------------------|
| Web | totalConductor | valorCliente |
| Móvil | totalCost | clientFare |
| WhatsApp | rango_min | rango_max |

### Wiki actualizada
- `21-calculo-tarifa.md` — sección "Actualización 2026-06-27 (2)".

## 2026-06-28 (sesión 12) — Fix sync categoría conductor móvil ↔ web ↔ BD

**Bug reportado:** conductor mal categorizado en móvil. Admin corrige web → BD OK. Móvil no refleja cambio → conductor no puede aceptar servicios.

### Causa raíz encontrada
Dos campos distintos de la misma tabla `cars`, sin sincronización:
- **Web escribe:** `cars.service_type` (columna string plana).
- **Móvil lee:** `cars.features.carType` (JSON anidado).

Fuentes: `AplicacionMovilTmasplus/App/app/(tabs)/DriverReservationsScreen.tsx:300,305` filtra reservas por `features.carType`. `AplicacionWebTmasplus/.../services/cars.service.ts:18,150,570` opera solo sobre `service_type`. Nadie hace bridge → cambio web queda invisible al filtro móvil.

### Archivos editados (3) + nuevos (2)

**Nuevos:**
- `App/hooks/useDriverCarSync.ts` — hook que hace refetch inicial + subscribe Realtime a UPDATE de `cars` filtrado por `driver_id`. Actualiza Redux `auth.profile.service_type` en cuanto llega el cambio en BD.
- `App/sql/backfill-cars-service-type.sql` — migración idempotente que copia `features->>'carType'` → `service_type` para vehículos legacy sin `service_type` poblado.

**Editados:**
- `App/app/(tabs)/DriverReservationsScreen.tsx` — `fetchActiveCarType` ahora prioriza `service_type`, cae a `features.carType` como fallback. Alinea filtro móvil con lo que escribe web.
- `App/app/Vehicle/carScreen.tsx:77` — `mapCarRow.carType` ahora usa `row.service_type || row.features?.carType` (canónico + fallback).
- `App/app/(tabs)/CarnetScreen.tsx:99` — select ahora incluye `service_type`, prioriza sobre otros campos legacy.
- `App/app/_layout.tsx` — importa y activa `useDriverCarSync` en `GlobalServices()`.

### Verificación
- `npx tsc --noEmit` — sin errores nuevos en archivos tocados (errores preexistentes en `_layout.tsx` sobre React UMD son de antes).

### Fases resueltas del plan
- ✅ Fase A: localización del caché (era `cars.features.carType` con auto-refresh 30s en `DriverReservationsScreen`).
- ✅ Fase B: refetch al arrancar (integrado en `useDriverCarSync`).
- ✅ Fase C: Realtime subscription a `cars` del conductor (implementado en `useDriverCarSync`).
- ⏳ Fase D (arquitectónico): poblar `bookings.car_type_id` FK + trigger sincronizar `features.carType` ↔ `service_type` — pendiente decisión operaciones.

### Pasos de deploy
1. Correr `App/sql/backfill-cars-service-type.sql` en Supabase SQL Editor (Studio) para conductores legacy que solo tienen `features.carType`. Script incluye diagnóstico previo (fila 1) — revisar conteos antes de aceptar UPDATE (fila 3).
2. Deploy móvil con hook + fallback.
3. Verificar en device: conductor logueado con categoría A → admin web cambia a B → app conductor debería actualizar `service_type` en Redux en < 5s sin reinicio.

### Riesgos monitoreables
- **Realtime channel adicional** consume 1 conexión adicional por conductor logueado. Verificar cuota Supabase (default 200 concurrent) si escala.
- **Race condition** si conductor acepta reserva justo cuando admin cambia categoría. Fase D arquitectónico mitiga con validación server-side.
- **Vehículos sin categoría en ambos campos** (fila 5 del script): admin debe corregirlos manualmente, hook los mantiene con `service_type=null` sin crash.

### Cross-canal pricing — estado consolidado
| Aspecto | Excel | Python | RPC | Web | Móvil (post-fix) | backendRemoto |
|---------|-------|--------|-----|-----|------------------|---------------|
| Aplica `min_fare` | ❌ | ✅ post | ✅ post | ✅ pre | ✅ **post** | ✅ post |
| Margen 25% base | J25 post | total post | total post | total post | **total post** | total post |
| Δ Aeropuerto constante | 10k hc | 10k hc | 10k hc | **12k** | **12k** | 12k BD |
| Δ Programado constante | 4k hc | 4k hc | 4k hc | **4.8k** | **4.8k** | 4k+BD |
| `valor_hora/60` | n/a | ✅ | ✅ | ✅ | ✅ | ✅ |
| Aeropuerto Haversine | n/a | n/a | n/a | ✅ | ✅ | ✅ |
| Conceptos independientes | mezcla | mezcla | mezcla | ✅ | ✅ | parcial |

Móvil ahora ~95% alineado con web. Diferencia residual: routing provider (Mapbox/Google móvil vs Google web vs OSRM backend).
  chat_messages, complaints, complaints+user_type, favorites, referrals, storage buckets.
- Ingestar web docs: `DATABASE_SCHEMA.md`, `WORKFLOWS.md`, `API_DOCUMENTATION.md`,
  `REFERIDOS_SPEC.md`, `RESEND_AUTOMATION.md`.
- Servicios web (`src/services/`): 14 servicios estáticos.
- Flujos end-to-end (página por flujo, no por servicio).
- Mapa pantallas Expo Router ↔ slice Redux.
