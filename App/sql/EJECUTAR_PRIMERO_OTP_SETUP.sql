-- ═════════════════════════════════════════════════════════════════════════════════
-- SISTEMA OTP - SETUP PARA SUPABASE
-- ═════════════════════════════════════════════════════════════════════════════════
--
-- 📋 INSTRUCCIONES:
-- 1. Abre: https://app.supabase.com → Tu Proyecto
-- 2. SQL Editor → Nueva Query
-- 3. COPIA TODO ESTE ARCHIVO (Ctrl+A, Ctrl+C)
-- 4. PEGA en el SQL Editor (Ctrl+V)
-- 5. Presiona "Run" o Ctrl+Enter
-- 6. Espera a que termine (verás "Success")
--
-- ⚠️ IMPORTANTE: Ejecuta TODO de una sola vez, no por partes
-- ═════════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PASO 0: ELIMINAR VISTAS                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

DROP VIEW IF EXISTS public.booking_stats CASCADE;
DROP VIEW IF EXISTS public.active_bookings CASCADE;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PASO 1: AGREGAR COLUMNAS OTP A TABLA BOOKINGS                              │
-- └─────────────────────────────────────────────────────────────────────────────┘

ALTER TABLE public.bookings ALTER COLUMN otp SET DATA TYPE VARCHAR(4);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_generated_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PASO 2: CREAR ÍNDICES                                                       │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE INDEX IF NOT EXISTS idx_bookings_otp_status ON public.bookings(otp, otp_verified, status);
CREATE INDEX IF NOT EXISTS idx_bookings_otp_generated_at ON public.bookings(otp_generated_at) WHERE otp IS NOT NULL AND otp_verified = false;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PASO 3: RECREAR VISTAS                                                      │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE VIEW public.active_bookings AS
SELECT 
  b.*,
  c.first_name || ' ' || c.last_name AS customer_full_name,
  c.mobile AS customer_mobile,
  d.first_name || ' ' || d.last_name AS driver_full_name,
  d.mobile AS driver_mobile
FROM public.bookings b
LEFT JOIN public.users c ON b.customer = c.id
LEFT JOIN public.users d ON b.driver = d.id
WHERE b.status IN ('NEW', 'ACCEPTED', 'STARTED', 'ARRIVED');

CREATE VIEW public.booking_stats AS
SELECT 
  customer,
  COUNT(*) AS total_bookings,
  COUNT(CASE WHEN status = 'COMPLETE' THEN 1 END) AS completed_bookings,
  COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_bookings,
  SUM(CASE WHEN status = 'PAID' THEN total_cost ELSE 0 END) AS total_spent,
  AVG(CASE WHEN status = 'COMPLETE' THEN total_trip_time END) AS avg_trip_time
FROM public.bookings
GROUP BY customer;

-- ═════════════════════════════════════════════════════════════════════════════════
-- ✅ FIN DEL SCRIPT
-- ═════════════════════════════════════════════════════════════════════════════════
-- 
-- El sistema OTP está listo. Ahora puedes:
-- ✓ Generar OTP al confirmar llegada
-- ✓ Guardar en base de datos
-- ✓ Validar código en la app
-- ✓ Habilitar "Iniciar Viaje" solo con OTP verificado
-- 
-- ═════════════════════════════════════════════════════════════════════════════════
