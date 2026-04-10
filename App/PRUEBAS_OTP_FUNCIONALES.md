-- =====================================================
-- PRUEBAS FUNCIONALES DEL SISTEMA OTP
-- =====================================================

/**
 * RESUMEN DE IMPLEMENTACIÓN
 * 
 * El sistema OTP de 4 dígitos funciona así:
 * 
 * 1️⃣ CONDUCTOR LLEGA AL PUNTO DE RECOGIDA
 *    └─ Presiona "Confirmar Llegada"
 *    └─ Sistema genera OTP aleatorio (0000-9999)
 *    └─ OTP se guarda en BD con estado otp_verified = false
 *    └─ Se envía notificación al cliente con el código
 * 
 * 2️⃣ CLIENTE RECIBE NOTIFICACIÓN
 *    └─ Notificación contiene el código OTP: "🔐 Tu código: 5832"
 *    └─ Cliente ve el código en la app (si está abierta)
 *    └─ Cliente comparte el código verbalmente al conductor
 * 
 * 3️⃣ CONDUCTOR VALIDA EL CÓDIGO
 *    └─ Presiona botón "🔐 Verificar Código"
 *    └─ Se abre modal OtpModal
 *    └─ Conductor ingresa el código de 4 dígitos
 *    └─ Si es correcto:
 *       ├─ Botón cambia a "✓ OTP Verificado" (verde)
 *       ├─ Botón "Iniciar Viaje" se habilita
 *       └─ otp_verified = true en BD
 *    └─ Si es incorrecto:
 *       └─ Mostrar alerta "Código incorrecto"
 * 
 * 4️⃣ INICIAR VIAJE
 *    └─ Solo disponible si OTP está verificado
 *    └─ Presiona "Iniciar Viaje"
 *    └─ Viaje comienza (status = STARTED)
 * 
 * 
 * ARQUITECTURA DE ARCHIVOS MODIFICADOS
 * 
 * ├─ sql/otp-verification-system.sql (NUEVO)
 * │  └─ Script SQL con campos: otp, otp_verified, otp_generated_at, otp_verified_at
 * │
 * ├─ common/services/OtpService.ts (ACTUALIZADO)
 * │  ├─ generateOtp() → genera "0000"-"9999"
 * │  ├─ saveOtp(bookingId, code) → guarda en BD
 * │  ├─ validateOtp(bookingId, inputCode) → valida y marca como verificado
 * │  ├─ getOtp(bookingId) → obtiene OTP actual
 * │  └─ markOtpAsVerified(bookingId) → marca como verificado
 * │
 * ├─ app/(tabs)/ReservationTripScreen.tsx (ACTUALIZADO)
 * │  ├─ Imports: OtpService, OtpModal
 * │  ├─ State: otpModalVisible, currentOtp, otpVerified
 * │  ├─ handleConfirmArrival() → genera OTP y lo envía al cliente
 * │  ├─ handleOTPMatch(isMatch) → valida el código ingresado
 * │  ├─ handleStartTrip() → solo funciona si otpVerified = true
 * │  └─ Render: 2 botones en ARRIVED_AT_PICKUP
 * │     ├─ Verificar Código (naranja/verde)
 * │     └─ Iniciar Viaje (gris/amarillo)
 * │
 * ├─ components/OtpModal.tsx (EXISTENTE, SIN CAMBIOS)
 * │  └─ Modal que muestra input para ingresar código
 * │
 * └─ app/Booking/BookingCabScren.tsx (EXISTENTE)
 *    └─ Cliente ve el OTP en modal cuando status = ARRIVED
 * 
 * 
 * FLUJO DE DATOS
 * 
 * Conductor App                     Base de Datos              Cliente App
 * ──────────────────────────────────────────────────────────────────────
 * 
 * "Confirmar Llegada"
 *    │
 *    ├─ Generar OTP: "5832"
 *    ├─ Guardar en BD: otp="5832", otp_verified=false
 *    │                      ↓↓↓
 *    │          bookings.otp = "5832"
 *    │          bookings.otp_verified = false
 *    │          bookings.otp_generated_at = NOW()
 *    │                      ↑↑↑
 *    ├─ Push: "🔐 Código: 5832"
 *    └─ Mostrar modal OtpModal
 *
 * Cliente recibe notificación y comparte código
 *
 * Conductor ingresa "5832" en modal
 *    │
 *    ├─ Validar con BD
 *    ├─ Si coincide:
 *    │  ├─ Marcar verified: otp_verified=true
 *    │  │        ↓↓↓
 *    │  │   bookings.otp_verified = true
 *    │  │   bookings.otp_verified_at = NOW()
 *    │  │        ↑↑↑
 *    │  ├─ Mostrar "✓ OTP Verificado"
 *    │  └─ Habilitar "Iniciar Viaje"
 *    │
 *    └─ Si no coincide:
 *       └─ Error "Código incorrecto, intenta de nuevo"
 * 
 * 
 * PRUEBAS FUNCIONALES PASO A PASO
 * ═════════════════════════════════════════════════════════════════════
 */

-- ════════════════════════════════════════════════════════════════════
-- PRUEBA 1: Verificar que las columnas existan
-- ════════════════════════════════════════════════════════════════════
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name IN ('otp', 'otp_verified', 'otp_generated_at', 'otp_verified_at')
ORDER BY ordinal_position;

-- Resultado esperado:
-- column_name       | data_type | is_nullable | column_default
-- ─────────────────────────────────────────────────────────────
-- otp               | varchar   | Yes         | 
-- otp_verified      | boolean   | Yes         | false
-- otp_generated_at  | timestamptz | Yes       | 
-- otp_verified_at   | timestamptz | Yes       | 


-- ════════════════════════════════════════════════════════════════════
-- PRUEBA 2: Verificar un booking existente (test con reservación real)
-- ════════════════════════════════════════════════════════════════════

-- Encuentra una reservación en estado ARRIVED
SELECT 
  id,
  reference,
  status,
  customer_name,
  driver_name,
  otp,
  otp_verified,
  otp_generated_at,
  otp_verified_at,
  created_at,
  updated_at
FROM bookings
WHERE status = 'ARRIVED'
ORDER BY created_at DESC
LIMIT 5;

-- Si no hay, crea una de prueba:
-- (Ejecuta en la app primero: Confirmar Llegada)


-- ════════════════════════════════════════════════════════════════════
-- PRUEBA 3: Simular OTP generado y guardado
-- ════════════════════════════════════════════════════════════════════

-- Paso 1: Selecciona el ID de un booking en status ARRIVED
-- (resultado de PRUEBA 2, example: 'c3f4e8a2-b1d0-4c8f-a3e2-f2e8b1c4d5e6')

-- Paso 2: Simula que se guardó un OTP (como lo haría handleConfirmArrival)
UPDATE bookings
SET 
  otp = '7523',
  otp_verified = false,
  otp_generated_at = NOW()
WHERE id = 'c3f4e8a2-b1d0-4c8f-a3e2-f2e8b1c4d5e6'
  AND status = 'ARRIVED';

-- Verifica que se guardó:
SELECT id, otp, otp_verified, otp_generated_at FROM bookings
WHERE id = 'c3f4e8a2-b1d0-4c8f-a3e2-f2e8b1c4d5e6';

-- Resultado esperado:
-- id                                    | otp  | otp_verified | otp_generated_at
-- ─────────────────────────────────────────────────────────────────────────
-- c3f4e8a2-b1d0-4c8f-a3e2-f2e8b1c4d5e6 | 7523 | false        | 2026-04-04 14:32:10.123456+00


-- ════════════════════════════════════════════════════════════════════
-- PRUEBA 4: Validar OTP (como lo haría handleOTPMatch)
-- ════════════════════════════════════════════════════════════════════

-- Paso 1: Obtiene el OTP actual
SELECT otp FROM bookings
WHERE id = 'c3f4e8a2-b1d0-4c8f-a3e2-f2e8b1c4d5e6';
-- → Resultado: '7523'

-- Paso 2: Valida si lo ingresado coincide
-- (En TypeScript: const isMatch = inputOtp === storedOtp; // "7523" === "7523" ✓)

-- Paso 3: Si coincide, marca como verificado
UPDATE bookings
SET 
  otp_verified = true,
  otp_verified_at = NOW()
WHERE id = 'c3f4e8a2-b1d0-4c8f-a3e2-f2e8b1c4d5e6';

-- Verifica:
SELECT id, otp, otp_verified, otp_verified_at FROM bookings
WHERE id = 'c3f4e8a2-b1d0-4c8f-a3e2-f2e8b1c4d5e6';

-- Resultado esperado (otp_verified = true):
-- id                                    | otp  | otp_verified | otp_verified_at
-- ─────────────────────────────────────────────────────────────────────────
-- c3f4e8a2-b1d0-4c8f-a3e2-f2e8b1c4d5e6 | 7523 | true         | 2026-04-04 14:32:15.654321+00


-- ════════════════════════════════════════════════════════════════════
-- PRUEBA 5: Verificar flujo COMPLETO en la app (manual)
-- ════════════════════════════════════════════════════════════════════

/**
 * PASOS A SEGUIR EN LA APP:
 * 
 * 1. INSTANCIA DEL CONDUCTOR:
 *    • Abre la app como conductor
 *    • Acepta una reservación inmediata
 *    • Navega hacia el cliente
 *    • Llega al punto de recogida
 * 
 * 2. CONFIRMAR LLEGADA:
 *    • Presiona botón "Confirmar Llegada"
 *    • Esperamos 2-3 segundos para que se procese
 *    • Verificar en consola:
 *      ✅ OTP SERVICIO - GENERAR OTP
 *      🔐 CÓDIGO GENERADO: [número]
 *      💾 [OTP SERVICE] Guardando OTP en Supabase...
 * 
 *    • Se abre modal "🔐 Verificar Código"
 *    • Botón "Iniciar Viaje" aparece DESHABILITADO (gris)
 * 
 * 3. VER NOTIFICACIÓN EN CLIENT:
 *    • Abre otra ventana/emulador como cliente
 *    • Recibe notificación push:
 *      "🔐 Tu código de verificación: [número]"
 *      "Tu conductor ha llegado..."
 * 
 * 4. INGRESA CÓDIGO CORRECTO:
 *    • En el modal del conductor, ingresa el código visto
 *    • Ejemplo: si viste "5832", ingresa "5832"
 *    • Presiona "Confirmar"
 * 
 *    • Si es correcto:
 *      ✅ Botón cambia a "✓ OTP Verificado" (VERDE)
 *      ✅ Botón "Iniciar Viaje" se HABILITA (AMARILLO)
 *      ✅ Alerta: "El código OTP ha sido verificado..."
 *      ✅ Console: "...OTP VÁLIDO ✅"
 * 
 *    • Si es incorrecto:
 *      ❌ Alerta: "El código que ingresaste no es correcto"
 *      ❌ Botón permanece naranja
 *      ❌ Botón "Iniciar Viaje" sigue deshabilitado
 * 
 * 5. INICIAR VIAJE:
 *    • Presiona "Iniciar Viaje" (ahora habilitado)
 *    • Confirmación: "¿Confirmas que el pasajero X está a bordo?"
 *    • Presiona "Iniciar"
 *    • Viaje comienza (status = STARTED)
 *    • Cliente recibe: "¡Tu viaje ha comenzado! 🚗"
 * 
 * 
 * PRUEBAS DE CASOS EXCEPCIONALES:
 * 
 * ✓ Código incorrecto:
 *   - Intenta ingresar "1111" siendo el código "5832"
 *   - Debe mostrar error "Código incorrecto"
 *   - Botoni "Iniciar Viaje" sigue deshabilitado
 * 
 * ✓ Código vacío:
 *   - Intenta confirmar sin ingresar nada
 *   - Debe permitir intentar de nuevo
 * 
 * ✓ Cerrar y reabrir modal:
 *   - Presiona X para cerrar el modal
 *   - Presiona "🔐 Verificar Código" de nuevo
 *   - Modal se abre con el mismo código
 *   - Debe seguir funcionando
 * 
 * ✓ Cancelar viaje:
 *   - Si rechaza presionar "Iniciar Viaje"
 *   - Vuelve al estado ARRIVED
 *   - Puede intentar de nuevo
 */


-- ════════════════════════════════════════════════════════════════════
-- PRUEBA 6: Validar datos en BD después de completar flujo
-- ════════════════════════════════════════════════════════════════════

-- Después de completar el viaje, verifica:
SELECT 
  id,
  reference,
  status,
  otp,
  otp_verified,
  otp_generated_at,
  otp_verified_at,
  trip_start_time,
  created_at
FROM bookings
WHERE status IN ('STARTED', 'ARRIVED')
ORDER BY created_at DESC
LIMIT 3;

-- Resultado esperado:
-- Si viaje inició correctamente:
-- - status = STARTED
-- - otp = '5832' (o el código generado)
-- - otp_verified = true
-- - otp_verified_at = NOT NULL (fecha cuando validó)
-- - trip_start_time = NOT NULL (fecha cuando inició)


-- ════════════════════════════════════════════════════════════════════
-- PRUEBA 7: Limpiar OTPs expirados (mantenimiento)
-- ════════════════════════════════════════════════════════════════════

-- OTPs que no fueron verificados hace más de 10 minutos
SELECT 
  id,
  reference,
  otp,
  otp_verified,
  otp_generated_at,
  NOW() - otp_generated_at AS "Tiempo transcurrido"
FROM bookings
WHERE otp IS NOT NULL
  AND otp_verified = false
  AND otp_generated_at < NOW() - INTERVAL '10 minutes'
ORDER BY otp_generated_at DESC;

-- Para limpiar (opcional):
UPDATE bookings
SET otp = NULL, otp_verified = false
WHERE otp IS NOT NULL
  AND otp_verified = false
  AND otp_generated_at < NOW() - INTERVAL '10 minutes';


-- ════════════════════════════════════════════════════════════════════
-- PRUEBA 8: Estadísticas de OTP
-- ════════════════════════════════════════════════════════════════════

-- Total de códigos generados
SELECT COUNT(*) as "Total OTPs generados"
FROM bookings
WHERE otp IS NOT NULL;

-- Tasa de éxito (cuántos se validaron)
SELECT 
  COUNT(*) FILTER (WHERE otp_verified = true) as "Validados",
  COUNT(*) FILTER (WHERE otp_verified = false) as "Pendientes",
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE otp_verified = true) / 
    NULLIF(COUNT(*), 0), 2
  ) as "Tasa de éxito (%)"
FROM bookings
WHERE otp IS NOT NULL;

-- Viajes que iniciaron con OTP verificado
SELECT COUNT(*) as "Viajes iniciados con OTP verificado"
FROM bookings
WHERE status = 'STARTED'
  AND otp_verified = true;


-- ════════════════════════════════════════════════════════════════════
-- PRUEBA 9: Verificar logs en consola
-- ════════════════════════════════════════════════════════════════════

/**
 * LOGS ESPERADOS EN CONSOLA DEL CONDUCTOR:
 * 
 * [CONFIRMAR LLEGADA]
 * ════════════════════════════════════════════════════════════════════
 * 🔐🔐🔐 OTP SERVICIO - GENERAR OTP 🔐🔐🔐
 * 🔐 CÓDIGO GENERADO: 5832
 * 🔐 Un código de **4 dígitos**
 * 🔐 Tipo: string - Largo: 4
 * 🔐 Este código DEBE mostrarse en la pantalla
 * ════════════════════════════════════════════════════════════════════
 * 💾 [OTP SERVICE] Guardando OTP en Supabase...
 *    BookingID: c3f4e8a2-b1d0-4c8f-a3e2-f2e8b1c4d5e6
 *    OTP Code: 5832
 * ✅ [OTP SERVICE] OTP guardado correctamente
 * ✅ OTP guardado en base de datos: 5832
 * 
 * [INGRESA CÓDIGO EN MODAL]
 * ════════════════════════════════════════════════════════════════════
 * ✔️ [OTP SERVICE] Validando OTP...
 *    BookingID: c3f4e8a2-b1d0-4c8f-a3e2-f2e8b1c4d5e6
 *    Input OTP: 5832
 * ✅ [OTP SERVICE] OTP VÁLIDO ✅
 * ✅ [OTP] OTP válido ingresado por conductor
 * ✅ [OTP SERVICE] OTP marcado como verificado
 * 
 * [INICIAR VIAJE]
 * ════════════════════════════════════════════════════════════════════
 * (Normal flow, sin cambios específicos de OTP)
 */


-- ════════════════════════════════════════════════════════════════════
-- CHECKLIST DE VERIFICACIÓN
-- ════════════════════════════════════════════════════════════════════

/**
 * ✓ CHECKLIST TÉCNICO:
 * 
 * [ ] SQL Script ejecutado:
 *     - Columna 'otp' tipo VARCHAR(4) ✓
 *     - Columna 'otp_verified' tipo BOOLEAN default false ✓
 *     - Columna 'otp_generated_at' tipo TIMESTAMPTZ ✓
 *     - Columna 'otp_verified_at' tipo TIMESTAMPTZ ✓
 *     - Índice creado para búsquedas rápidas ✓
 * 
 * [ ] Archivos actualizados:
 *     - OtpService.ts: generateOtp(), saveOtp(), validateOtp(), etc. ✓
 *     - ReservationTripScreen.tsx: estados, funciones, render ✓
 *     - OtpModal.tsx: sin cambios (ya existe) ✓
 *     - BookingCabScren.tsx: sin cambios (cliente ve OTP) ✓
 * 
 * [ ] Lógica implementada:
 *     - Generar OTP al confirmar llegada ✓
 *     - Guardar OTP en BD ✓
 *     - Enviar OTP al cliente via push notification ✓
 *     - Modal OTP en conductor ✓
 *     - Validar código ingresado ✓
 *     - Marcar como verificado ✓
 *     - Habilitar "Iniciar Viaje" solo si verificado ✓
 *     - Botones cambien color según estado ✓
 * 
 * [ ] Sin errores de compilación:
 *     - ReservationTripScreen.tsx ✓
 *     - OtpService.ts ✓
 * 
 * [ ] Mensajes en consola funcionan:
 *     - Generación de OTP ✓
 *     - Guardado en BD ✓
 *     - Validación ✓
 *     - Marcado como verificado ✓
 * 
 * 
 * ✓ CHECKLIST FUNCIONAL (PRUEBAS EN LA APP):
 * 
 * [ ] FASE 1: Confirmar Llegada
 *     - [ ] Botón "Confirmar Llegada" presionable
 *     - [ ] Modal OTP aparece automáticamente
 *     - [ ] Conductor ve los logs en consola
 *     - [ ] "Verificar Código" botón aparece (naranja)
 *     - [ ] "Iniciar Viaje" botón aparece (gris, deshabilitado)
 * 
 * [ ] FASE 2: Cliente recibe notificación
 *     - [ ] Push notification llega al cliente
 *     - [ ] Incluye el código OTP: "🔐 Tu código: XXXX"
 *     - [ ] Cliente ve la notificación en su app
 * 
 * [ ] FASE 3: Validación de código
 *     - [ ] Conductor ingresa código correcto
 *     - [ ] Botón cambia a "✓ OTP Verificado" (verde)
 *     - [ ] "Iniciar Viaje" botón se habilita (amarillo)
 *     - [ ] Alerta = "El código OTP ha sido verificado"
 *     - [ ] Logs en consola muestran "OTP VÁLIDO"
 * 
 * [ ] FASE 4: Error si código incorrecto
 *     - [ ] Conductor ingresa código INCORRECTO
 *     - [ ] Alerta = "El código que ingresaste no es correcto"
 *     - [ ] Botón sigue naranja "🔐 Verificar Código"
 *     - [ ] "Iniciar Viaje" sigue gris (deshabilitado)
 * 
 * [ ] FASE 5: Iniciar viaje
 *     - [ ] Botón "Iniciar Viaje" presionable (si OTP verificado)
 *     - [ ] Confirmación: "¿Confirmas que el pasajero está a bordo?"
 *     - [ ] Presiona "Iniciar"
 *     - [ ] Status cambia a STARTED
 *     - [ ] Cliente recibe: "¡Tu viaje ha comenzado! 🚗"
 * 
 * [ ] FASE 6: Botón deshabilitado si OTP no verificado
 *     - [ ] "Iniciar Viaje" NO funciona si OTP pendiente
 *     - [ ] Modal aún se puede abrir y validar
 * 
 * [ ] Base de datos
 *     - [ ] Booking tiene otp = "XXXX"
 *     - [ ] otp_verified = true (después de validar)
 *     - [ ] otp_generated_at = fecha
 *     - [ ] otp_verified_at = fecha (después de validar)
 *     - [ ] Todos con valores consistentes
 */
