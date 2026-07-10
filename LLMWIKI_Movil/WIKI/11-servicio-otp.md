# Servicio OtpService

> Genera, guarda y valida el OTP de **4 dígitos** que arranca un viaje.
> Cliente recibe / conductor valida. Persistencia directa en `bookings`.

---
tags: [movil, servicio, otp, seguridad]
entidades: [OtpService, bookings, useOtpTimer]
---

## Ubicación

`App/common/services/OtpService.ts` — objeto singleton exportado.

## API

| Método | Parámetros | Vía | Retorna |
|--------|-----------|-----|---------|
| `generateOtp()` | — | local (`Math.random`) | `string` 4 dígitos `padStart(4, '0')` |
| `saveOtp(bookingId, otpCode)` | UUID + string | **REST PATCH** `/rest/v1/bookings?id=eq.{id}` con JWT | `boolean` |
| `validateOtp(bookingId, inputOtp)` | UUID + string | SDK `supabase.from('bookings').select('otp')` | `boolean`; si OK llama `markOtpAsVerified` |
| `getOtp(bookingId)` | UUID | SDK | `{ otp, otp_verified }` |
| `markOtpAsVerified(bookingId)` | UUID | **REST PATCH** con JWT | `boolean` |

## Columnas que toca (tabla `bookings`)

| Columna | Tipo | Set por |
|---------|------|---------|
| `otp` | `VARCHAR(4)` | `saveOtp` (string 4 dígitos) |
| `otp_verified` | `BOOLEAN DEFAULT false` | `saveOtp` (false), `markOtpAsVerified` (true) |
| `otp_generated_at` | `TIMESTAMPTZ` | `saveOtp` |
| `otp_verified_at` | `TIMESTAMPTZ` | `markOtpAsVerified` |

⚠️ Schema original creó `otp VARCHAR(6)`. Setup OTP altera a `VARCHAR(4)`. Si
no se corrió `EJECUTAR_PRIMERO_OTP_SETUP.sql`, escritura sigue funcionando pero
columna acepta 6.

## Patrón mixto SDK vs REST

- Lecturas (`validateOtp`, `getOtp`) → SDK con `.select().single()`.
- Escrituras (`saveOtp`, `markOtpAsVerified`) → **fetch REST + JWT**
  (`getSupabaseAuthHeaders(true)`). Razón: evita lock de auth del SDK que
  puede colgar en RN. Ver [[02-stack-tecnologico]].

## Flujo end-to-end

1. Conductor llega → UI confirma "He llegado" → `generateOtp()` + `saveOtp()`.
2. Cliente ve OTP en pantalla → lo dicta al conductor.
3. Conductor abre `DriverOtpVerificationModal`, ingresa 4 dígitos.
4. `validateOtp` lee `bookings.otp`, compara. Si OK → `markOtpAsVerified`.
5. Hook `useOtpTimer` mantiene cuenta regresiva persistente entre reinicios.
6. Pantalla habilita botón "Iniciar Viaje" → estado `bookings.status = 'STARTED'`.

## Pantallas y hooks involucrados

- `App/components/DriverOtpVerificationModal.tsx`
- `App/hooks/useOtpTimer.ts`
- `App/OTP_SYSTEM_README.md`, `OTP_TIMER_PERSISTENT_GUIDE.md` (guías históricas)

## Setup SQL

- `App/sql/EJECUTAR_PRIMERO_OTP_SETUP.sql` — altera columna, crea índices
  `idx_bookings_otp_status`, `idx_bookings_otp_generated_at` (parcial donde
  `otp IS NOT NULL AND otp_verified = false`). Recrea vistas `active_bookings`
  y `booking_stats` que dropea al inicio.
- `App/sql/otp-verification-system.sql`, `OTP_TIMER_SETUP.sql` — complementos.

## RLS implícito

OtpService corre con JWT del **conductor** (escritura) o del cliente (lectura).
Política `Drivers can update their bookings` (ver [[17-esquema-bookings]])
permite PATCH solo si `auth.uid()::text = driver::text`. Si conductor no está
asignado todavía a la reserva, PATCH falla silencioso.

## Fuentes
- `App/common/services/OtpService.ts`
- `App/sql/EJECUTAR_PRIMERO_OTP_SETUP.sql`
- `App/sql/bookings-schema.sql`
- `App/documentacion/ARQUITECTURA.md` §7.4
