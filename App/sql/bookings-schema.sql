-- =====================================================
-- TABLA DE BOOKINGS (RESERVAS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(10) UNIQUE NOT NULL,
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Información del Cliente
  customer UUID REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_token TEXT,
  customer_contact VARCHAR(20),
  customer_city VARCHAR(100),
  customer_status VARCHAR(50) DEFAULT 'NEW',
  
  -- Información del Conductor
  driver UUID REFERENCES public.users(id) ON DELETE SET NULL,
  driver_name VARCHAR(255),
  driver_contact VARCHAR(20),
  driver_token TEXT,
  driver_status VARCHAR(50),
  driver_image TEXT,
  driver_arrived_time TIMESTAMPTZ,
  driver_active_status BOOLEAN DEFAULT false,
  
  -- Ubicaciones
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8) NOT NULL,
  pickup_lng DECIMAL(11, 8) NOT NULL,
  drop_address TEXT NOT NULL,
  drop_lat DECIMAL(10, 8) NOT NULL,
  drop_lng DECIMAL(11, 8) NOT NULL,
  
  -- Detalles del Viaje
  car_type VARCHAR(50),
  car_model VARCHAR(100),
  car_image TEXT,
  plate_number VARCHAR(20),
  vehicle_number VARCHAR(20),
  distance DECIMAL(10, 2),
  duration INTEGER, -- en minutos
  trip_type VARCHAR(50) DEFAULT 'Solo Ida',
  trip_urban VARCHAR(50) DEFAULT 'Urbano',
  
  -- Costos y Pago
  estimate DECIMAL(10, 2),
  trip_cost DECIMAL(10, 2),
  convenience_fees DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2),
  driver_share DECIMAL(10, 2),
  payment_mode VARCHAR(50) DEFAULT 'cash',
  payment_gateway VARCHAR(50),
  
  -- Estado y Tiempos
  status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'ACCEPTED', 'STARTED', 'ARRIVED', 'COMPLETE', 'PAID', 'CANCELLED')),
  trip_start_time TIMESTAMPTZ,
  trip_end_time TIMESTAMPTZ,
  total_trip_time INTEGER, -- en minutos
  
  -- Seguridad
  otp VARCHAR(6),
  
  -- Promociones
  promo_applied BOOLEAN DEFAULT false,
  promo_code VARCHAR(50),
  promo_details JSONB,
  
  -- Otros
  observations TEXT,
  requested_drivers JSONB DEFAULT '{}',
  driver_estimates JSONB DEFAULT '{}',
  waypoints JSONB DEFAULT '[]',
  coords JSONB,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para búsqueda
  CONSTRAINT valid_coordinates CHECK (
    pickup_lat BETWEEN -90 AND 90 AND
    pickup_lng BETWEEN -180 AND 180 AND
    drop_lat BETWEEN -90 AND 90 AND
    drop_lng BETWEEN -180 AND 180
  )
);

-- =====================================================
-- MIGRACIÓN PARA TABLAS EXISTENTES (evita errores por columnas faltantes)
-- =====================================================

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer UUID;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_token TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_contact VARCHAR(20);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_city VARCHAR(100);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_status VARCHAR(50);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver UUID;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_contact VARCHAR(20);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_token TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_status VARCHAR(50);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_image TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_arrived_time TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_active_status BOOLEAN DEFAULT false;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10, 8);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(11, 8);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS drop_address TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS drop_lat DECIMAL(10, 8);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS drop_lng DECIMAL(11, 8);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS car_type VARCHAR(50);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS car_model VARCHAR(100);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS car_image TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS plate_number VARCHAR(20);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(20);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS distance DECIMAL(10, 2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS trip_type VARCHAR(50);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS trip_urban VARCHAR(50);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS estimate DECIMAL(10, 2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS trip_cost DECIMAL(10, 2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS convenience_fees DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_share DECIMAL(10, 2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS trip_start_time TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS trip_end_time TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_trip_time INTEGER;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp VARCHAR(6);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_applied BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_details JSONB;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS requested_drivers JSONB DEFAULT '{}';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_estimates JSONB DEFAULT '{}';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS coords JSONB;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Defaults para columnas críticas
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'NEW';
ALTER TABLE public.bookings ALTER COLUMN customer_status SET DEFAULT 'NEW';
ALTER TABLE public.bookings ALTER COLUMN payment_mode SET DEFAULT 'cash';

-- Backfill de columnas legacy comunes (si existen)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'uid_customer'
  ) THEN
    EXECUTE 'UPDATE public.bookings SET customer = NULLIF(uid_customer::text, '''')::uuid WHERE customer IS NULL AND uid_customer::text ~* ''^[0-9a-fA-F-]{36}$''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'uid_driver'
  ) THEN
    EXECUTE 'UPDATE public.bookings SET driver = NULLIF(uid_driver::text, '''')::uuid WHERE driver IS NULL AND uid_driver::text ~* ''^[0-9a-fA-F-]{36}$''';
  END IF;
END $$;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer);
CREATE INDEX IF NOT EXISTS idx_bookings_driver ON public.bookings(driver);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status ON public.bookings(customer_status);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_status ON public.bookings(driver_status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(reference);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_city ON public.bookings(customer_city);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON public.bookings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_status_created ON public.bookings(driver, status, created_at DESC);

-- =====================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- =====================================================
-- FUNCIÓN PARA GENERAR CÓDIGO DE REFERENCIA ÚNICO
-- =====================================================

CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  IF NEW.reference IS NULL THEN
    -- Generar referencia de 6 caracteres
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    NEW.reference := result;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_booking_reference ON public.bookings;
CREATE TRIGGER trigger_generate_booking_reference
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_reference();

-- =====================================================
-- FUNCIÓN PARA CALCULAR total_cost
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost := COALESCE(NEW.trip_cost, 0) 
                   + COALESCE(NEW.convenience_fees, 0) 
                   - COALESCE(NEW.discount, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_total_cost ON public.bookings;
CREATE TRIGGER trigger_calculate_total_cost
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_cost();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can update their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Only admins can delete bookings" ON public.bookings;

-- Política: Los usuarios pueden ver sus propias reservas
CREATE POLICY "Users can view their own bookings"
  ON public.bookings
  FOR SELECT
  USING (
    auth.uid()::text = customer::text OR
    auth.uid()::text = driver::text OR
    (SELECT user_type FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Política: Los clientes pueden crear reservas
CREATE POLICY "Customers can create bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = customer::text AND
    (SELECT user_type FROM public.users WHERE id = auth.uid()) IN ('customer', 'company')
  );

-- Política: Conductores pueden actualizar reservas asignadas
CREATE POLICY "Drivers can update their bookings"
  ON public.bookings
  FOR UPDATE
  USING (
    auth.uid()::text = driver::text OR
    auth.uid()::text = customer::text OR
    (SELECT user_type FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Política: Solo admin puede eliminar
CREATE POLICY "Only admins can delete bookings"
  ON public.bookings
  FOR DELETE
  USING (
    (SELECT user_type FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- =====================================================
-- TABLA DE TRACKING (Ubicación en tiempo real)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.booking_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2), -- km/h
  heading DECIMAL(5, 2), -- 0-360 degrees
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_tracking_coordinates CHECK (
    lat BETWEEN -90 AND 90 AND
    lng BETWEEN -180 AND 180
  )
);

CREATE INDEX IF NOT EXISTS idx_tracking_booking ON public.booking_tracking(booking_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_driver ON public.booking_tracking(driver_id, timestamp DESC);

-- RLS para tracking
ALTER TABLE public.booking_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tracking for their bookings" ON public.booking_tracking;
DROP POLICY IF EXISTS "Drivers can insert tracking" ON public.booking_tracking;

CREATE POLICY "Users can view tracking for their bookings"
  ON public.booking_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = booking_id
      AND (b.customer::text = auth.uid()::text OR b.driver::text = auth.uid()::text)
    )
  );

CREATE POLICY "Drivers can insert tracking"
  ON public.booking_tracking
  FOR INSERT
  WITH CHECK (auth.uid()::text = driver_id::text);

-- =====================================================
-- FUNCIÓN PARA NOTIFICAR NUEVAS RESERVAS
-- =====================================================

CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  notification JSON;
BEGIN
  -- Solo notificar si es una nueva reserva
  IF NEW.status = 'NEW' AND OLD IS NULL THEN
    notification = json_build_object(
      'booking_id', NEW.id,
      'customer_city', NEW.customer_city,
      'pickup_address', NEW.pickup_address,
      'drop_address', NEW.drop_address,
      'car_type', NEW.car_type,
      'trip_cost', NEW.trip_cost,
      'distance', NEW.distance
    );
    
    -- Notificar a través del canal de Supabase Realtime
    PERFORM pg_notify('new_booking', notification::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_booking ON public.bookings;
CREATE TRIGGER trigger_notify_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de reservas activas
CREATE OR REPLACE VIEW active_bookings AS
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

-- Vista de estadísticas de reservas
CREATE OR REPLACE VIEW booking_stats AS
SELECT 
  customer,
  COUNT(*) AS total_bookings,
  COUNT(CASE WHEN status = 'COMPLETE' THEN 1 END) AS completed_bookings,
  COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_bookings,
  SUM(CASE WHEN status = 'PAID' THEN total_cost ELSE 0 END) AS total_spent,
  AVG(CASE WHEN status = 'COMPLETE' THEN total_trip_time END) AS avg_trip_time
FROM public.bookings
GROUP BY customer;

COMMENT ON TABLE public.bookings IS 'Tabla principal de reservas de viajes';
COMMENT ON TABLE public.booking_tracking IS 'Tracking en tiempo real de conductores durante viajes';
