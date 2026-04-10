-- ==========================================
-- TRIGGER: Auto-crear membresía al registrarse
-- ==========================================

-- 1️⃣ CREAR TABLA MEMBERSHIPS (SI NO EXISTE)
CREATE TABLE IF NOT EXISTS memberships (
  uid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conductor UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('ACTIVA', 'CANCELADA', 'EXPIRADA', 'PENDIENTE')),
  costo DECIMAL(10, 2) NOT NULL DEFAULT 90600,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_terminada DATE NOT NULL,
  periodo INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣ CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_memberships_conductor ON memberships(conductor);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_fecha_terminada ON memberships(fecha_terminada);

-- 3️⃣ HABILITAR ROW LEVEL SECURITY
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- 4️⃣ CREAR POLÍTICAS DE SEGURIDAD
DROP POLICY IF EXISTS "Conductores ven sus membresías" ON memberships;
DROP POLICY IF EXISTS "Insertar membresías" ON memberships;
DROP POLICY IF EXISTS "Actualizar membresías propias" ON memberships;

CREATE POLICY "Conductores ven sus membresías" 
ON memberships FOR SELECT USING (conductor = auth.uid());

CREATE POLICY "Insertar membresías" 
ON memberships FOR INSERT WITH CHECK (conductor = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Actualizar membresías propias" 
ON memberships FOR UPDATE USING (conductor = auth.uid());

-- ==========================================
-- CREAR FUNCIÓN Y TRIGGER AUTO-MEMBRESÍA
-- ==========================================

-- 5️⃣ CREAR FUNCIÓN QUE INSERTE MEMBRESÍA CUANDO SE REGISTRA USUARIO
CREATE OR REPLACE FUNCTION public.crear_membresia_al_registrarse()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar membresía PENDIENTE para cada nuevo usuario
  INSERT INTO public.memberships (
    conductor,
    status,
    costo,
    fecha_inicio,
    fecha_terminada,
    periodo
  )
  VALUES (
    NEW.id,
    'PENDIENTE',
    90600,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    30
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6️⃣ CREAR TRIGGER QUE EJECUTE LA FUNCIÓN
DROP TRIGGER IF EXISTS trigger_crear_membresia_al_registrarse ON auth.users;

CREATE TRIGGER trigger_crear_membresia_al_registrarse
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_membresia_al_registrarse();

-- ==========================================
-- VERIFICAR CONFIGURACIÓN
-- ==========================================

-- 7️⃣ VERIFICAR QUE TODO ESTÁ CONFIGURADO
SELECT 
  '✅ Tabla memberships configurada' AS status,
  COUNT(*) as total_memberships
FROM memberships;

-- 8️⃣ VER TODOS LOS USUARIOS Y SUS MEMBRESÍAS
SELECT 
  u.id,
  u.email,
  u.created_at,
  m.uid as membership_id,
  m.status,
  m.fecha_terminada,
  CASE WHEN m.uid IS NOT NULL THEN '✅ Tiene membresía' ELSE '❌ Sin membresía' END as estado
FROM auth.users u
LEFT JOIN memberships m ON u.id = m.conductor
ORDER BY u.created_at DESC;

-- 9️⃣ PRÓXIMO USUARIO QUE SE REGISTRE TENDRÁ MEMBRESÍA PENDIENTE AUTOMÁTICAMENTE ✨

