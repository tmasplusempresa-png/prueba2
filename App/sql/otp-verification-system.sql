-- =====================================================
-- SISTEMA OTP DE 4 DÍGITOS PARA CONFIRMACIÓN DE LLEGADA
-- =====================================================

-- 1️⃣ ACTUALIZAR TABLA BOOKINGS
-- Modificar columna otp de VARCHAR(6) a VARCHAR(4)
ALTER TABLE public.bookings 
ALTER COLUMN otp SET DATA TYPE VARCHAR(4);

-- 2️⃣ AGREGAR COLUMNA OTP_VERIFIED (si no existe)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT false;

-- 3️⃣ AGREGAR COLUMNA OTP_GENERATED_AT (para rastrear cuándo se generó)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS otp_generated_at TIMESTAMPTZ;

-- 4️⃣ AGREGAR COLUMNA OTP_VERIFIED_AT (cuándo se verificó)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;

-- 5️⃣ CREAR ÍNDICE PARA BÚSQUEDAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_bookings_otp_status 
ON public.bookings(otp, otp_verified, status);

-- 6️⃣ DESCRIPCIÓN DE FLUJO:
-- ✅ Conductor confirma llegada (status = ARRIVED)
--    → Sistema genera OTP aleatorio de 4 dígitos (0000-9999)
--    → OTP se guarda en columna 'otp'
--    → Se marca 'otp_verified = false'
--    → Se envía push notification al cliente con el código
--
-- 👤 Cliente recibe notificación con OTP
--    → App muestra el código en pantalla (en modal o banner)
--    → Cliente puede compartir código con conductor si es necesario
--
-- 🚗 Conductor intenta iniciar viaje
--    → Se abre modal OtpModal para que conductor ingrese código
--    → Si código coincide con 'otp' en base de datos:
--       → otp_verified = true
--       → otp_verified_at = NOW()
--       → Botón "Iniciar Viaje" se habilita
--       → Viaje comienza (status = STARTED)

-- 7️⃣ FUNCIÓN AUXILIAR: Generar OTP en el cliente
-- (Esto se hace en el código TypeScript con función como esta:)
-- const generateOTP = (): string => {
--   return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
-- };

-- 8️⃣ PRUEBA: Verificar columnas creadas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name IN ('otp', 'otp_verified', 'otp_generated_at', 'otp_verified_at')
ORDER BY ordinal_position;

-- 9️⃣ SCRIPT DE LIMPIEZA (opcional - ejecutar manualmente si es necesario):
-- Limpiar OTPs expirados (más de 10 minutos) que no fueron verificados
-- UPDATE public.bookings 
-- SET otp = NULL, otp_verified = false 
-- WHERE otp IS NOT NULL 
--   AND otp_verified = false 
--   AND otp_generated_at < NOW() - INTERVAL '10 minutes';
