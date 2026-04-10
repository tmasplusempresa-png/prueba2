-- ═══════════════════════════════════════════════════════════════
-- OTP TIMER SETUP - Sistema de countdown persistente
-- ═══════════════════════════════════════════════════════════════
-- Agregar columnas para rastrear el timer de OTP (3 minutos)

-- 1️⃣ Agregar columnas a tabla bookings si no existen
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS otp_timer_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS otp_timer_duration INTEGER DEFAULT 180;

-- 📌 Índice para queries rápidas del timer
CREATE INDEX IF NOT EXISTS idx_bookings_otp_timer_started 
ON bookings(otp_timer_started_at, status)
WHERE otp_timer_started_at IS NOT NULL AND status = 'ARRIVED';

-- 2️⃣ Crear tabla para rastrear notificaciones de countdown (opcional, para auditoría)
CREATE TABLE IF NOT EXISTS otp_timer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  timer_started_at TIMESTAMPTZ NOT NULL,
  timer_started_by_driver_id UUID NOT NULL REFERENCES drivers(id),
  time_remaining_at_notification INTEGER, -- segundos restantes cuando se notificó
  notification_type VARCHAR(50), -- 'TIMER_STARTED', 'TIMER_UPDATE', 'TIMER_EXPIRED'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📌 Índices para la tabla de notificaciones
CREATE INDEX IF NOT EXISTS idx_otp_timer_notif_booking 
ON otp_timer_notifications(booking_id);

CREATE INDEX IF NOT EXISTS idx_otp_timer_notif_customer 
ON otp_timer_notifications(customer_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- COMENTARIOS EXPLICATIVOS
-- ═══════════════════════════════════════════════════════════════

/*
📋 FLUJO DE TIMER:

1. CONDUCTOR CONFIRMA LLEGADA:
   - handleConfirmArrival() se ejecuta
   - Guarda: otp_timer_started_at = NOW()
   - Status: ARRIVED
   - NO muestra modal de inmediato ❌

2. CLIENTE RECIBE NOTIFICACIÓN:
   - Push: "Tu conductor ha llegado"
   - Incluye: "El código se compartirá en 3 minutos"
   - Ver countdown en tiempo real

3. APP CALCULA TIEMPO RESTANTE:
   - const remainingTime = 180 - (NOW - otp_timer_started_at)
   - Se actualiza cada segundo
   - Si remainingTime <= 0: mostrar modal automáticamente

4. DESPUÉS DE 3 MINUTOS:
   - Modal aparece automáticamente al conductor
   - Se muestra el código OTP
   - Cliente recibe notificación: "Código compartido, servicio iniciando"
   - Ambos ven el contador en cero

✅ Timer persiste aunque cierre la app:
- Si vuelve a abrir: calcula tiempo restante = 180 - (NOW - otp_timer_started_at)
- Si el tiempo ya pasó: muestra modal directamente

*/
