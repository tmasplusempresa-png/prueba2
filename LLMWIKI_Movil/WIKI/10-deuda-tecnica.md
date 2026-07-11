# Deuda técnica e inconsistencias (AplicacionMovilTmasplus)

> Catálogo vivo de incoherencias detectadas durante la ingesta inicial.
> Cada ítem debe cerrarse con un PR y removerse de aquí.
>
> ⚠️ **Heredado de `LLMWIKITmasPlus/` (wiki original, móvil + web).** Esta
> copia está reenfocada a `AplicacionMovilTmasplus`, pero varios ítems de
> abajo mencionan explícitamente `AplicacionWebTmasplus` — se dejaron como
> referencia cruzada (algunos bugs de tarifa afectan ambos canales), pero
> **no son responsabilidad de este proyecto**. No agregar ítems nuevos
> puramente del web acá; van en la wiki raíz (`LLMWIKITmasPlus/`).

---
tags: [deuda, refactor]
entidades: [Firebase, store, secretos, correo]
---

## 1. Firebase pertenece a otro proyecto/plantilla

- Proyecto Firebase activo: **`treasupdate`**.
- `GoogleService-Info.plist` declara `BUNDLE_ID = com.treasapp.treas24`.
- Identificadores reales de T+Plus: `com.tmasplus.tmasplus` / `tmasplus.tmasplus`.
- Origen: resto de plantilla base "treas" sobre la que se construyó TmasPlus.
- Riesgo: confusión operativa y mezcla de buckets/Cloud Functions.
- **El backend de pagos Daviplata vive ahí** — no se puede mover sin
  reescribir o migrar las Cloud Functions.

## 2. Identificadores divergentes entre `.env` y `app.config.js`

- `.env`: `EXPO_OWNER=tmasplus_cto`, `APP_IDENTIFIER=com.tmasplus.tmasplus`.
- `App/app.config.js`: fallbacks `tmasplus` y `com.releaseunocero`.
- Acción: alinear fallbacks con los identificadores reales o eliminarlos.

## 3. Secretos en el repositorio

- `TOKEN_BUSSINESS` de Topus **hardcodeado** en `App/config/keys.ts`.
  → mover a `.env`.
- `GoogleService-Info.plist` **versionado** en el repo (a diferencia de
  `google-services.json` que sí está en `.gitignore`).
  → ignorar y distribuir fuera de git.

## 4. Doble camino de correo

- Supabase Auth = principal.
- Firebase `smtpdata` + `sendEmailVerification` = legado.
- En `App/login/EmailVerification.tsx` `sendEmailVerification` aún aparece (parte
  del import comentado).
- Acción: consolidar todo en Supabase y eliminar el camino Firebase.

## 5. Doble store Redux

- Store activo: `App/common/store/index.ts` — usado por `_layout.tsx`.
- Store legado: `App/common/store/store.ts` con
  `App/common/reducers/reducers.ts` (`combineReducers` + `actionTypes`).
- Riesgo: nuevos contribuyentes despachan al store equivocado.
- Acción: unificar, eliminar el legado.

## 6. Documentos `.md` históricos sin podar (móvil)

- ~60 archivos `.md` en `App/` raíz documentan features ya integradas (OTP,
  notificaciones, tracking, mapa, Agora). Mezclan guías de implementación
  pasadas con checklists vivos.
- Acción: archivar en `App/documentacion/historico/` o eliminar los que ya
  reflejan estado actual.

## 7. Web: lógica de "aceptar viaje" prohibida

No es deuda *existente* sino una **regla a respetar**: la web no debe
incorporar aceptación de viajes por conductor. Ya está señalada en el README
y en `AGENTS.md` de la wiki — vigilar PRs.

## 8. Tipos de RPC y vistas

Cada nueva RPC, view o tabla en Supabase **debe** registrarse explícitamente
en `Database['public']...` de `database.types.ts` (web y móvil). Faltan ya
algunos casos — revisar al regenerar tipos.

## 9. Discrepancia docs ↔ schema real de `bookings`

`App/documentacion/ENDPOINTS_Y_CONSULTAS.md` reporta columnas y estados que
**NO coinciden** con `App/sql/bookings-schema.sql`:

| Doc oficial dice | Schema real (SQL vigente) |
|------------------|---------------------------|
| `customer_id`, `driver_id` | `customer`, `driver` |
| Estado `COMPLETED` | `COMPLETE` |
| `pickup_location`, `destination_location` | `pickup_address`, `pickup_lat`, `pickup_lng`, `drop_address`, `drop_lat`, `drop_lng` |
| `price` | `trip_cost`, `total_cost`, `driver_share`, `estimate` |
| `cancelled_by`, `reason` | No existen; `observations` sí |
| Tabla `tracking` con `latitude`, `longitude`, `timestamp_ms` | Tabla `booking_tracking` con `lat`, `lng`, `timestamp` |

Acción: regenerar la sección §2 y §5 de `ENDPOINTS_Y_CONSULTAS.md` desde el
SQL real. Riesgo si no se cierra: nuevos contribuyentes escriben queries que
fallan en silencio (PostgREST devuelve `[]` si la columna no existe pero el
schema acepta esa key).

Detalle en [[17-esquema-bookings]].

## 10. `users.user_type` permite `company`, doc omite

Schema acepta `'customer','driver','company','admin'`. Doc móvil habla solo
de cliente/conductor/admin. `company` se usa en reservas corporativas (web
`AddBooking`). Documentar explícitamente.

## 11. `users.approved` / `blocked` vs `is_active` / `verified`

- Script base `create-users-table-with-rls.sql` crea `is_active`, `verified`.
- Web `AuthContext` filtra por `approved`, `blocked`.
- ARQUITECTURA.md menciona ambas.

Si ambas columnas existen, la fuente de verdad es ambigua. Acción: auditar
qué scripts añaden `approved`/`blocked`, decidir cuál set se conserva, migrar
y borrar la otra.

## 12. `memberships.conductor` apunta a `auth.users`, no `public.users`

Rompe joins naturales `memberships ↔ users` y obliga al cliente a pasar
`auth.uid()` en vez de `users.id`. Confusión documentada genera consultas
vacías sin error (`getMemberships(users.id)` devuelve `[]`). Migrar la FK a
`public.users(id)` o documentar prominentemente en
[[14-servicio-memberships]].

## 13. Canal `tracking-*` duplicado entre dos servicios

`BookingRealtimeService.subscribeToLocationTracking` y
`DriverTrackingService.subscribeToDriverTracking` abren ambos
`tracking-{bookingId}` / `tracking_{bookingId}` sobre `booking_tracking`
INSERT con configs distintas. Si la pantalla suscribe a los dos, recibe el
mismo evento dos veces. Unificar — preferir el segundo (tipado +
`broadcast.self` + `presence` + `onError`).

## 15. Fórmula tarifa duplicada / divergente entre canales

Algoritmo real vive en `App/common/actions/FareCalculator.tsx` (móvil) usando
columnas de `car_types`. El backend remoto WhatsApp consume otra tabla
`VehicleCategory` con columnas equivalentes pero sin las extras del móvil:
`convenience_fees`, `convenience_fee_type`, `umbral_intermunicipal_km`,
columnas `*_inter`, recargos hardcoded ($4.000 programado sin aeropuerto,
$5.000 protocolo, margen × 1.25 cliente).

Riesgo: admin actualiza precio en un canal, otro queda desfasado → cliente
recibe cotización distinta vía WhatsApp vs móvil para el mismo viaje.

Acción:
- Documentar fuente de verdad oficial (recomendado: `car_types` móvil).
- Migrar `VehicleCategory` a `car_types` o crear vista compartida.
- Mover constantes hardcoded ($4.000, $5.000, ×1.25, ceil 100, umbral 29 km) a BD.

Ver [[21-calculo-tarifa]] §Discrepancias.

## 17. Excel oficial NO aplica `min_fare`

`Base para Agente T+Plus.xlsm` hoja `board` calcula `F25` (cobro mínimo) pero
**nunca** lo compara contra `SUM(F17:F24)`. Operador humano debería forzarlo
manualmente. Esto explica reportes operacionales históricos donde cotizaciones
en planilla salen debajo del piso.

Fix Excel: `J25 = ROUNDUP(MAX(SUM(J17:J24), F25), -2)`.

Ver [[23-modelo-pricing-excel-oficial]] §8.4.

## 18. Δ Aeropuerto 10 000 vs Tabla Tarifas 12 000

**Cerrado para móvil y web.** Móvil lee `car_types.delta_aeropuerto` (12k). Web
detecta aeropuerto por Haversine (`isNearAirport`) y suma 12k desde BD (sesión 8).
backendRemoto también corregido.

❌ `sistema_calculo` Python + RPC SQL siguen con 10k hardcoded — fuera del
alcance de esta wiki (ver [[24-sistema-calculo-python]]).

## 19. Combinación aeropuerto + programado ignora `delta_aeropuerto_prog`

**Cerrado.** Móvil y web usan rama explícita aero+programado →
`delta_aeropuerto_prog`. backendRemoto también corregido.

❌ Excel + sistema_calculo Python + RPC SQL siguen sumando plana — fuera del alcance.

## 20. Modo "Por Hora" no escala con duración

**Cerrado para alcance de esta wiki.** Móvil no expone modo Por Hora.
backendRemoto ya escala con minutos reales.

❌ Excel + sistema_calculo Python + RPC SQL siguen con `F19*60` — fuera del alcance.

## 21. Ida y Vuelta sin efecto en cobro (Excel, Python, RPC)

Selección `Asignación!C2` puramente informativa. **App móvil sí aplica** `mult = 2` en `getVehiclePrice` — divergencia inversa.

## 22. Sin auto-detección Urbano↔Intermunicipal en Excel

**Cerrado.** Móvil auto-detecta por umbral 29 km, web usa misma lógica
(Haversine). backendRemoto también corrige con umbral en el engine.

❌ Excel + sistema_calculo Python/RPC SQL siguen sin auto-detección — fuera del alcance.

## 24. Web sufre el mismo bug "cliente paga < min_fare" por vector distinto

**Cerrado.** Fix aplicado en sesión 7: `bookings.service.ts` ahora incluye
`trip_cost` en el payload (`trip_cost = total_cost - fees + discount`).
Verificado con `npx tsc --noEmit` → exit 0.

⚠️ Reservas pre-fix no se corrigen retroactivamente. Auditoría SQL pendiente
para reportar a operaciones.

## 25. Web tiene política propia divergente

**Cerrado parcial.** Fixes aplicados en sesiones 7-8:

- ✅ `trip_cost` en payload (fix bug min_fare).
- ✅ Flag aeropuerto por Haversine (`isNearAirport`, `airports.json`).
- ✅ `schedulingSurcharge` rama explícita aero+programado → `delta_aeropuerto_prog`.
- ✅ UI muestra total conductor (mínimo) + rango `[min, max]`.

Pendientes (requieren decisión de operaciones):
- ❌ Margen 25% retail.
- ❌ Flag protocolo.
- ❌ ROUNDUP centena (hoy Math.round entero).
- ❌ Path empresarial completo.

Detalle `28-tarifa-web-dashboard` (ver LLMWIKITmasPlus/ raíz del workspace, no existe en esta copia).

## 23. Seis implementaciones paralelas del cálculo

Excel / Python / RPC SQL / Móvil / backendRemoto Agente / **Web Dashboard**
divergen en varios puntos. Ver matriz en [[26-comparativa-canales-pricing]] y comparativa
detallada en [[27-tarifa-backendremoto-agente]].

**backendRemoto es la implementación más correcta hoy** — corrige 4 hallazgos
históricos. RPC SQL y Python sistema_calculo están atrasados.

**Acción estratégica actualizada:**
1. Portar mejoras de `backendRemoto/engine.py` a la RPC SQL `calcular_tarifa` en sistema_calculo.
2. App móvil migra a `supabase.rpc('calcular_tarifa', ...)`, elimina `FareCalculator.tsx`.
3. Deprecar `sistema_calculo/tarifa_engine.py` o sincronizarlo desde backendRemoto.

Una sola fuente de verdad (RPC SQL) cerca del cliente, alimentada por la
implementación más actualizada.

## 16. Nombre `rate_per_hour` engaña

**Cerrado para móvil.** `FareCalculator.tsx` reemplazó `rate_per_hour` por
`valor_hora / 60` (sesión 9). Columna BD no renombrada — migración BD queda
como mejora futura si se unifica schema.

## 14. OTP en schema vs servicio

Schema original: `otp VARCHAR(6)`. Setup OTP altera a `VARCHAR(4)`.
`OtpService.generateOtp` produce **4** dígitos. Si un entorno no corrió
`EJECUTAR_PRIMERO_OTP_SETUP.sql`, todo sigue funcionando pero columna acepta
hasta 6 — riesgo de basura. Marcar el setup como obligatorio post-deploy.

## 26. `addActualsToBooking` no puede reconstruir protocolo/peajes/parqueadero al finalizar viaje

`bookings` no tiene columnas para `is_protocol`, `tolls_total` ni `parking`
(confirmado contra `App/supabase/BBDDRemota.sql`). `FareCalculator` sí soporta
esos conceptos como recargos aditivos ([[21-calculo-tarifa]]), pero solo se
aplican al **crear** la reserva — no hay snapshot para reaplicarlos cuando
`addActualsToBooking` recalcula distancia/tiempo reales al finalizar
(afecta tanto el flujo de reserva programada como el inmediato, que ya usa
esta función hoy vía `bookingsSlice.ts:685`). Si un viaje con protocolo o
peajes se recalcula al final, esos recargos se pierden del precio final.

**Verificado 2026-07-04:** hoy **ninguna UI móvil setea realmente estos
flags** — no hay toggle de protocolo ni de parqueadero en ninguna pantalla de
reserva, y `getPrice()` (`BookingScreen.tsx`), que sí calculaba `tollsCost`,
nunca se invoca (código muerto). El placeholder `tollsCost: "No contiene"` en
`pendingBookingRef` es honesto hoy, no un bug de pérdida de datos activo.
**Por eso esto es deuda prospectiva (plomería), no un bug urgente** — bajado
de prioridad, decisión explícita del usuario 2026-07-04 de posponerlo.

**Plan de cierre ya diseñado, para cuando se retome:**
1. `ALTER TABLE bookings ADD COLUMN is_protocol boolean DEFAULT false, ADD COLUMN tolls_total numeric(10,2) DEFAULT 0, ADD COLUMN parking_cost numeric(10,2) DEFAULT 0;`
2. Poblar en `saveBooking.ts` (`tolls_total: bookingData.tollsCost`, etc.) y
   `CreateReservationScreen.tsx` — solo tiene sentido una vez exista UI real
   para protocolo/parqueadero/peajes en el flujo de reserva.
3. Pasar como `extraFareContext` a `addActualsToBooking` en
   `ReservationTripScreen.tsx` (`completeTrip`) y `bookingsSlice.ts`
   (transición STARTED→REACHED) — el parámetro ya existe desde 2026-07-04,
   solo falta invocarlo con estos 3 campos.
4. **No implementado en esta sesión** — ningún cambio de código ni de BD
   aplicado para este ítem (se revirtieron los intentos parciales del
   2026-07-04 antes de correr cualquier migración).

## 28. `<CarDetails>` renderizado en `BookingCabScren.tsx` sin props — modal muerto

`App/app/Booking/BookingCabScren.tsx:2515` renderiza
`<CarDetails currentBooking={currentBooking} colorScheme={colorScheme} />`.
El componente `CarDetails.tsx` espera `{ visible, onSelectVehicle, distance,
duration, tolls, isScheduled, isAirport }` — ninguna de esas props se pasa.
`visible` queda `undefined` → el `<Modal visible={undefined}>` nunca se
muestra. `BookingCabScren.tsx` (ruta `"Booking"`) sí está vivo y es central
(pantalla de "esperando conductor" a la que navega `BookingScreen.tsx` justo
tras crear la reserva) — pero este `<CarDetails>` específico es un remanente
inerte, probablemente de un flujo anterior donde el vehículo se elegía en
esta pantalla en vez de antes (ahora se elige en `BookingScreen.tsx`, que ya
tiene su propio cálculo correcto e independiente).

**No es bug de precio** — el precio ya está fijado antes de llegar aquí.
Limpieza menor: eliminar el `<CarDetails>` huérfano de `BookingCabScren.tsx`
(o el archivo `CarDetails.tsx` completo si no se usa en ningún otro lado).
Baja prioridad, sin fecha asignada.

## 27. `bookings.status` CHECK constraint no incluía `'REACHED'` — bug confirmado, cerrado

**✅ Cerrado 2026-07-04.** Migración ejecutada en BD remota por el usuario.

`App/supabase/BBDDRemota.sql:268-285` — constraint `bookings_status_check`
permite `NEW, PENDING, ACCEPTED, STARTED, ARRIVED, COMPLETE, PAID,
CANCELLED`. **No incluye `REACHED`.** Pero `REACHED` se usa activamente en 13
archivos (`bookingsSlice.ts`, `BookingCabScren.tsx`, `ActiveBookingScreen.tsx`,
`CustomerMap.tsx`, `index.tsx`, `PaymentDeais.tsx`, etc.) como transición
central del flujo de viaje inmediato (llegada a destino, antes de pago).

**⚠️ CONFIRMADO 2026-07-04 contra BD real** (no era dump desactualizado):

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass
  AND conname = 'bookings_status_check';
-- → CHECK (status::text = ANY (ARRAY['NEW','PENDING','ACCEPTED','STARTED',
--   'ARRIVED','COMPLETE','PAID','CANCELLED']::character varying[]))
-- Confirma: falta REACHED.
```

`REACHED` falta de verdad. Cada `UPDATE bookings SET status='REACHED'` (13
archivos activos: `bookingsSlice.ts`, `BookingCabScren.tsx`,
`ActiveBookingScreen.tsx`, `CustomerMap.tsx`, `index.tsx`,
`PaymentDeais.tsx`, etc.) probablemente falla en BD — atrapado por
try/catch en cada callsite, así que la UI local sigue funcionando (fase
avanza en el estado de React/Redux) pero el campo `bookings.status` en
Supabase **nunca llega a `REACHED`** realmente. Impacto: cualquier lógica que
dependa de leer `status='REACHED'` desde otra sesión/pantalla/trigger
(notificaciones, dashboard admin, `addActualsToBooking` cuando se llama con
booking recién releído de BD) puede estar operando sobre un status
desactualizado (`STARTED`) sin que nadie lo note.

Migración de cierre:

```sql
ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status::text = ANY (ARRAY[
    'NEW','PENDING','ACCEPTED','STARTED','ARRIVED','REACHED',
    'COMPLETE','PAID','CANCELLED'
  ]::text[]));
```

Migración aplicada. **Pendiente operacional (no técnico):** auditar cuántas
filas históricas quedaron con `status='STARTED'` que debieron pasar por
`REACHED` (síntoma del bug ya cerrado) — no se corrige retroactivo en esta
sesión, solo detener la sangría hacia adelante.

## 29. `ENABLE_DRIVER_MAP_RESERVATIONS = false` apagaba el modal de solicitud entrante — cerrado

**✅ Cerrado 2026-07-04.** `App/app/(tabs)/index.tsx:897` tenía este flag
hardcodeado en `false`. `bookingModalDecline` (controla si se muestra
`<BookingsView bookings={filteredBookings}>`, el modal con aceptar/rechazar)
**solo** se pone en `true` dentro de un efecto gateado por este flag
(línea ~1048-1056). Con el flag en `false`, el modal **nunca se mostraba** —
sin importar que `filteredBookings` (búsqueda realtime real, con filtro de
`carType` y radio de distancia, líneas 595-664) siguiera funcionando y
encontrando reservas válidas de forma independiente.

Síntoma reportado: conductor logueado, ubicación fake GPS correcta, probó
todos los tipos de vehículo — ningún servicio aparecía nunca. Coincide
exacto con este flag: el problema no era de matching/ubicación, era que el
modal jamás se abría.

**Fix:** flag cambiado a `true`. Agregados `console.log`/`console.warn` de
diagnóstico en `applyFilter` (índice 606) para exponer en Metro/logcat: (a)
cuántos bookings trae Supabase en status NEW, (b) por qué se descarta cada
uno (carType no coincide / sin pickup / fuera de rango), (c) si el
`carType` difiere solo por mayúsculas/espacios (alerta temprana del
riesgo #30), (d) eventos realtime INSERT recibidos.

### Riesgo secundario detectado, no confirmado como bug activo — vigilar con los logs nuevos

`applyFilter` compara `booking.carType === user?.carType` con `===`
estricto, sin normalizar. `DriverReservationsScreen.tsx` documenta que el
nombre de categoría del conductor (`cars.features.carType`, legado) y el de
`car_types.name` **divergieron históricamente** — por eso ese archivo usa un
helper `normalizeCarType` que este código no usa. Si tras destrabar el flag
persisten bookings sin aparecer, revisar el log `[DRIVER-FEED] carType
difiere solo por mayúsculas/espacios` — si aparece, portar
`normalizeCarType` a este filtro también.

## 30. `App/sql/` es una carpeta fantasma — 48 referencias en 15 páginas de la wiki

**Sistémico, detectado 2026-07-04.** Esa carpeta **nunca existió** en
`AplicacionMovilTmasplus/App` (confirmado repetidamente esta sesión — la
única fuente real de esquema es `App/supabase/BBDDRemota.sql`, un dump
plano). Sin embargo 15 páginas de esta wiki citan archivos como
`App/sql/bookings-schema.sql`, `App/sql/EJECUTAR_PRIMERO_OTP_SETUP.sql`,
`App/sql/enable-realtime-tracking.sql`, etc. como si existieran:

```
05-backend-supabase.md (2), 07-entidades-bd.md (2), 11-servicio-otp.md (4),
12-servicio-booking-realtime.md (3), 13-servicio-driver-tracking.md (1),
14-servicio-memberships.md (6), 15-servicio-call.md (1),
16-rest-endpoints-rpc.md (2), 17-esquema-bookings.md (2),
18-esquema-users-rls.md (8), 19-esquema-memberships.md (7),
20-realtime-channels.md (2), 21-calculo-tarifa.md (1),
22-plan-fix-bug-min-fare.md (6)
```

**Hipótesis:** contenido escrito a partir de una versión planeada/asumida
del repo (migraciones SQL versionadas por archivo, patrón común en otros
proyectos Supabase) que nunca se materializó así en este repo — el proyecto
real gestiona el esquema directamente en el dashboard de Supabase, sin
migraciones versionadas en git. Todo dato técnico (columnas, constraints,
triggers, RLS) citado *solo* desde un `App/sql/*` fantasma es **no
verificado** — puede ser correcto (si describe fielmente lo que hay en
Supabase) o puede ser una alucinación coherente nunca chequeada contra la
BD real. `17-esquema-bookings.md` y `13-servicio-driver-tracking.md` ya se
reconciliaron parcialmente contra `BBDDRemota.sql` esta sesión y tenían
errores reales (columnas `speed`/`heading`/`timestamp` inventadas en
`booking_tracking`, estados `PENDING`/`REACHED` faltantes).

**Cierre requerido (no completado en esta sesión, alcance grande):**
reconciliar las 13 páginas restantes contra `BBDDRemota.sql` y el código
real, una por una, quitando o corrigiendo cualquier afirmación que dependa
solo de una fuente `App/sql/*`. Priorizar `18-esquema-users-rls.md` (8 refs)
y `19-esquema-memberships.md` (7 refs) por ser las más citadas.

## 31. `DriverReservationsScreen.tsx` reinventaba tabla de alias de categoría — cerrado

**✅ Cerrado 2026-07-04.** Tenía su propia `CAR_TYPE_ALIASES` local,
incompleta — no incluía `"servicio_especial"` (valor real usado por el
registro de conductores en la web, ver `RegisterDriverPage.tsx`,
`Step3Vehicle.tsx`, `common/utils/carType.ts`). Cualquier conductor
registrado con esa categoría nunca veía ninguna reserva/servicio inmediato,
sin importar ubicación — el filtro de `carType` los excluía siempre.

Ya existía una tabla canónica completa y correcta:
`App/common/utils/carType.ts` (`toCanonicalCarType`), que sí mapea
`servicio_especial → ConfortPlus`. Fix: `DriverReservationsScreen.tsx` ahora
usa esa función compartida en vez de su copia local.

## 32. Botón "atrás" en header de mapa (conductor online) no hacía nada — cerrado

**✅ Cerrado 2026-07-04.** `App/app/(tabs)/index.tsx` — botón con ícono
`arrow-back` en el header superpuesto al mapa. Su `onPress` era
`if (!isDriverView) setIsMapVisible(false)` — para cuentas de conductor
(`isDriverView=true`) la condición nunca se cumplía, botón visible pero
muerto. Encontrado durante debug de sesión remota (Mac Apple Silicon,
reportado como "el botón de volver atrás no funciona"). Fix: ahora llama
`navigation.goBack()` si hay historial de navegación, con el comportamiento
viejo como fallback.

⚠️ Pendiente relacionado, no confirmado: overlay visual donde un botón
"Aceptar" de un ítem de lista se asoma superpuesto sobre el header superior
(capturas de pantalla de sesión remota). Geometría de `driverReservationsHalf`
(`position:absolute, bottom:126`) no explica el solapamiento con el header —
probablemente un frame de transición/medición de altura, no reproducido de
forma aislada. Sin fix aplicado, requiere captura de pantalla completa (sin
recortar) para diagnosticar bien.

## 33. `endBooking` tronaba por `driverProfile.location` vacío → confirmación de pago nunca aparecía — cerrado

**✅ Cerrado 2026-07-09.** Síntoma reportado: al finalizar un viaje
**on-demand con pago en efectivo**, no aparecía la confirmación
*"¿Confirmas que recibiste el pago en efectivo del cliente?"* (ver
[[06-flujos-negocio]] §5.1).

El bug **no estaba en el modal** sino antes, en la cadena que lleva a la
pantalla Payment. `finalizarReserva` (`app/Booking/BookingCabScren.tsx`) llama
`endBooking(...).unwrap()` y solo navega a `"Payment"` si el resultado es
`REACHED`. `endBooking` (`common/store/bookingsSlice.ts`) tomaba la ubicación
de `driverProfile.location` (= `state.auth.user.location`) y lanzaba
`throw new Error("Driver location data is missing")` si venía vacía o sin
lat/lng. Pero `state.auth.user.location` es poco fiable: el auth slice **no
maneja** `UPDATE_USER_LOCATION` (despachado desde `_layout.tsx`), así que casi
siempre es `undefined` — y **garantizado** en emulador sin GPS. Resultado:
`endBooking` truena → `finalizarReserva` cae al `catch` → error genérico →
**nunca navega a Payment → nunca se ve la confirmación de pago**.

**Fix:** `endBooking` ahora replica el patrón que ya usaba `updateLocation`
(misma raíz de bug documentada como comentario ahí): lee GPS en vivo con
`Location.getCurrentPositionAsync({ accuracy: High })` (si hay permiso),
fallback a `driverProfile.location` de Redux, y solo lanza el error si **ambos**
fallan. Así el flujo llega a Payment y la confirmación aparece.

**Nota:** el sistema de "conductor confirma pago" NO fue eliminado por versiones
recientes (verificado contra HEAD, working tree limpio). El commit
`f11c7a6 "comprobaciòn bug modal recibo de pago"` había arreglado un bug
**distinto** del mismo flujo: el gate `user.usertype === "driver"` fallaba tras
restaurar sesión (user crudo de Supabase Auth sin `usertype`) → se cambió a
`!isCustomer` por descarte.

## 34. Conductor no veía ningún servicio — dato inconsistente `cars.service_type` vs `features.carType`, no bug de código

**✅ Diagnosticado y corregido en datos, 2026-07-10.** Reporte del usuario:
*"al conductor no le aparecen los servicios"*. Se descartó primero que fuera
regresión del código de esa misma sesión (fix de piso `min_fare` en
`sharedFunctions.ts`/`bookingsSlice.ts`) — esos archivos no tocan `cars`,
`service_type` ni `DriverReservationsScreen.tsx` en absoluto.

**Método de diagnóstico** (reutilizable para casos similares):
1. `adb devices` → identificar emuladores conectados.
2. `adb -s <device> logcat -d ReactNativeJS:V "*:S" | grep "RESERVAS\|INMEDIATOS"`
   → leer directamente los logs `[RESERVAS]`/`[INMEDIATOS]` ya instrumentados
   en `DriverReservationsScreen.tsx` (no requiere Metro corriendo en foreground,
   el buffer de logcat persiste).
3. Con los IDs de los bookings candidatos de los logs, consultar Supabase
   **con `service_role` key** (el `anon` key sin sesión no ve nada por RLS,
   devuelve `[]` silencioso — no confundir con "no hay datos").
4. Cruzar contra `cars.service_type` / `cars.features->>carType` del driver.

**Causa raíz encontrada:** la cuenta de prueba `demo conductor`
(`fcc57421-e298-4365-88c0-087b575ff4a2`) tenía su única fila `cars` con:
```
service_type: "particular"        → canónico XPlus
features.carType: "ConfortPlus"   → canónico ConfortPlus
```
`fetchActiveCarType()` (`DriverReservationsScreen.tsx:289-317`) prioriza
`service_type` sobre `features.carType` por diseño (refleja ediciones del
dashboard web sin depender de un formato legado — ver ítem #31 de este mismo
catálogo). Con `service_type` ganando, el conductor quedaba categorizado como
**XPlus**, mientras el booking de prueba `3B8ZJV` (pickup a 0km exactos del
conductor, sin conductor asignado, `status=PENDING`) era `car_type=ConfortPlus`
→ no coincidía → filtrado silenciosamente, `Total: 0` en el log
`[INMEDIATOS] Tras filtrar`.

No era bug de `RESERVAS` tampoco: 0 filas crudas con `booking_type=reservation
AND status=PENDING` en ese momento — sencillamente no había reservas
programadas creadas, comportamiento correcto.

**Fix aplicado:** `PATCH cars.service_type = 'servicio_especial'` (mapea a
ConfortPlus en `toCanonicalCarType`) en la fila del driver de prueba, para que
coincida con su `features.carType` real. Confirmado end-to-end: tras el
siguiente ciclo de `fetchActiveCarType` (cada 30s), el log pasó de
`Total: 0` a `Total: 1, PENDING: 1`.

**Lección para operaciones:** si un conductor real reporta "no me llegan
servicios" y su vehículo/ubicación/categoría de reserva parecen correctos a
simple vista, revisar si `cars.service_type` (el que edita el dashboard web)
y `cars.features.carType` (legado móvil) **divergen** — el primero siempre
gana y puede estar desactualizado si alguien tocó el registro por un canal
sin tocar el otro. Ver [[06-flujos-negocio]] y [[21-calculo-tarifa]] para el
mismo patrón de "dos fuentes de verdad que divergen" en otras áreas del
sistema.

## 35. Margen cliente 25% — solo aplica al pronóstico, no al precio final (corregido)

**Estado: implementado a propósito, no cerrar como "bug".** Corrección
2026-07-04: el primer intento apagó `MARGEN_CLIENTE=0` **globalmente**
(rompió el rango del pronóstico al cliente, colapsó a un solo valor
repetido). Diseño correcto ya implementado:
- **Pronóstico** (cotizar/durante el viaje): `MARGEN_CLIENTE=0.25` sin
  tocar, sigue mostrando rango mínimo-máximo normal.
- **Precio final** (`addActualsToBooking`, al completar el servicio):
  cliente y conductor reciben el **mismo número** (`finalClientCost =
  finalCost`, sin margen en ese punto específico), con el piso al mínimo
  cotizado ya aplicado.

El 25% para modelo empresarial (`payment_mode='corp'`) sigue sin
implementar como flujo distinto — hoy el margen del pronóstico aplica igual
a toda reserva retail o corporativa por igual.

**Trabajo pendiente para cuando se implemente el modelo empresarial:**
1. Definir cómo se marca una reserva como empresarial (columna nueva en
   `bookings`, o derivarlo de `payment_mode='corp'`/`users.user_type='company'`
   que ya existen en el schema — ver [[07-entidades-bd]] item 10 de este
   catálogo).
2. Condicionar `MARGEN_CLIENTE` del **pronóstico** por ese flag en
   `FareCalculator.tsx` — pasar como parte de `context` (mismo patrón que
   `isAirport`/`isScheduled`). Retail = 0.25 actual (o el % que se decida),
   empresarial = otro %.
3. Decidir si el **precio final** también debería diferir para empresarial
   (hoy siempre cliente=conductor sin margen al finalizar, para todos).
4. Revisar `AplicacionWebTmasplus/.../utils/fareConstants.ts` (otro proyecto,
   no tocado en esta sesión) para consistencia cross-canal si aplica.
5. Actualizar [[21-calculo-tarifa]] cuando se implemente esta distinción.

## 36. `getCurrentPositionAsync` sin `try/catch` en `DriverReservationsScreen` — uncaught rejection cuando GPS no tiene fix — cerrado

**Síntoma reportado:** consola del conductor mostraba `Uncaught (in
promise) Error: Current location is unavailable. Make sure that location
services are enabled` (error nativo de `expo-location`, `CodedError`), sin
crash visible en pantalla pero con el promise sin manejar.

**Causa raíz:** `DriverReservationsScreen.tsx` (efecto de "Live GPS del
conductor", ~línea 197) llamaba `Location.getCurrentPositionAsync(...)`
seguido de `Location.watchPositionAsync(...)` dentro de un IIFE `async`
sin `try/catch`. Si el emulador/dispositivo tiene permisos concedidos pero
el GPS aún no entrega un fix (típico en emuladores o interiores), la
promesa de `getCurrentPositionAsync` rechaza y queda sin capturar — el
`liveCoords` (usado para el filtro estricto de 3km de servicios inmediatos)
nunca se setea y el error queda flotando en consola.

Nota: `mapaSensors.tsx` (otra pantalla que también usa GPS en vivo) ya
tenía este mismo patrón envuelto en `try/catch` desde antes — este efecto
de `DriverReservationsScreen.tsx` era la única llamada sin proteger.

**Fix aplicado:** ambas llamadas envueltas en `try/catch` independientes.
Si `getCurrentPositionAsync` falla, no bloquea — el `watchPositionAsync`
subsiguiente sigue intentando y actualiza `liveCoords` en cuanto haya
señal. Si `watchPositionAsync` también falla (permiso revocado a mitad de
sesión, hardware sin GPS), se marca `setLocationDenied(true)` para que la
UI lo refleje en vez de dejar la promesa sin manejar.

**Archivo:** `App/app/(tabs)/DriverReservationsScreen.tsx:197-216`.

## 37. Geocoding/autocompletado de rutas sin sugerencias en producción — key de Google Maps resuelta vacía — cerrado

**Síntoma reportado:** en el APK/AAB de producción, los campos de búsqueda
de origen/destino en `CreateReservationScreen.tsx` (`GooglePlacesAutocomplete`)
dejaron de mostrar sugerencias de direcciones. Sin crash ni error visible en
pantalla — el autocompletado simplemente no respondía.

**Causa raíz:** doble esquema de nombres de variables de entorno para la
API key de Google Maps, desalineado entre capas:

- `App/config/AppConfig.ts:127-130` resolvía la key de producción con
  `getEnv('GOOGLE_MAPS_API_KEY_PROD', getEnv('GOOGLE_MAPS_API_KEY_IOS', ''))`.
- `App/app.config.js` solo reenviaba `GOOGLE_MAPS_API_KEY_ANDROID` y
  `GOOGLE_MAPS_API_KEY_IOS` al bloque `extra` de Expo (nunca `_PROD`).
- En el dashboard de EAS (`eas env:list --environment production`) solo
  existía configurada `GOOGLE_MAPS_API_KEY_ANDROID` — ni `_PROD` ni `_IOS`.

Resultado: `API_KEY` se resolvía a `''` en el build de producción. En
local no se notaba porque el `.env` sí trae las 4 variantes
(`_DEV/_PROD/_ANDROID/_IOS`). Misma clase de problema que
`SUPABASE_SERVICE_ROLE_KEY` (ver ítem relacionado): nombre de variable
esperado por el código vs. nombre realmente provisionado en EAS, sin
validación que lo haga fallar ruidosamente — la librería de autocompletado
solo devuelve lista vacía ante key inválida/ausente.

No fue causado por cambios de dependencias: se descartó revisando
`git log -p` sobre `package.json` del fix de versiones Expo del mismo día
— no tocó `react-native-google-places-autocomplete`, `react-native-maps`
ni `expo-location`.

**Fix aplicado:** `App/config/AppConfig.ts:129` — se agregó
`GOOGLE_MAPS_API_KEY_ANDROID` como fallback intermedio antes de
`GOOGLE_MAPS_API_KEY_IOS`:

```ts
production: getEnv('GOOGLE_MAPS_API_KEY_PROD', getEnv('GOOGLE_MAPS_API_KEY_ANDROID', getEnv('GOOGLE_MAPS_API_KEY_IOS', '')))
```

Desplegado vía `eas update --channel production` (OTA, sin nueva build
nativa — `runtimeVersion` fijo en `1.0.4`).

**Nota/deuda pendiente relacionada:** `common/other/GoogleAPIFunctions.tsx`
(usado por `SearchScreen.tsx`) llama a una Cloud Function `googleapi` que
**no existe** en `functions/index.js` de este repo — si ese flujo de
búsqueda (distinto al de `CreateReservationScreen.tsx`) se usa en algún
punto, fallaría de forma silenciosa por un 404 nunca surfaceado a la UI.
Pendiente confirmar contra el proyecto de Firebase desplegado.

**Archivo:** `App/config/AppConfig.ts:129`, `App/app.config.js:23,69-70`,
`App/app/(tabs)/CreateReservationScreen.tsx:898-935`.

## Cómo cerrar un ítem

1. Abrir PR.
2. Quitar la sección correspondiente de este archivo.
3. Anotar el cierre en [`SCHEMA_LOG/log.md`](../SCHEMA_LOG/log.md).

## Fuentes
- `App/app/_layout.tsx`
- `App/config/keys.ts`
- `App/common/store/` (ambos stores)
- `App/login/EmailVerification.tsx`
- `TmasPlus_webSite/README.md` §Consideraciones de Desarrollo
- `TmasPlus_webSite/src/pages/AddBooking/AddBookingPage.tsx`
- `TmasPlus_webSite/src/services/bookings.service.ts`
