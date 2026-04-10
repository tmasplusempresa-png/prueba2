-- ==========================================
-- CREAR TABLA + INSERTAR + ACTIVAR MEMBRESÍA
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
CREATE POLICY "Conductores ven sus membresías" 
ON memberships FOR SELECT USING (conductor = auth.uid());

CREATE POLICY "Insertar membresías" 
ON memberships FOR INSERT WITH CHECK (conductor = auth.uid());

CREATE POLICY "Actualizar membresías propias" 
ON memberships FOR UPDATE USING (conductor = auth.uid());

-- ==========================================
-- INSERTAR NUEVA MEMBRESÍA
-- ==========================================

-- 5️⃣ INSERTAR UNA MEMBRESÍA PARA EL CONDUCTOR
INSERT INTO memberships (
  conductor,
  status,
  costo,
  fecha_inicio,
  fecha_terminada,
  periodo
)
VALUES (
  'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'::uuid,  -- UUID del conductor
  'PENDIENTE',                                      -- Inicialmente PENDIENTE
  90600,                                            -- Costo
  CURRENT_DATE,                                     -- Hoy
  CURRENT_DATE + INTERVAL '30 days',               -- Vence en 30 días
  30                                                -- Período de 30 días
)
ON CONFLICT DO NOTHING
RETURNING 
  uid,
  conductor,
  status,
  fecha_inicio,
  fecha_terminada;

-- ==========================================
-- ACTIVAR LA MEMBRESÍA CREADA
-- ==========================================

-- 6️⃣ ACTIVAR LA MEMBRESÍA (CAMBIAR A ACTIVA)
UPDATE memberships
SET 
  status = 'ACTIVA',
  updated_at = CURRENT_TIMESTAMP
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'::uuid
  AND status = 'PENDIENTE'
RETURNING 
  uid,
  conductor,
  status,
  fecha_inicio,
  fecha_terminada,
  (fecha_terminada - CURRENT_DATE) as dias_restantes;

-- ==========================================
-- VERIFICAR RESULTADO
-- ==========================================

-- 7️⃣ VER LA MEMBRESÍA ACTIVA
SELECT 
  uid,
  conductor,
  status,
  costo,
  fecha_inicio,
  fecha_terminada,
  (fecha_terminada - CURRENT_DATE) as dias_restantes,
  CASE 
    WHEN status = 'ACTIVA' THEN '✅ ACTIVA'
    WHEN status = 'PENDIENTE' THEN '⏳ PENDIENTE'
    WHEN status = 'CANCELADA' THEN '❌ CANCELADA'
    ELSE '⚠️ ' || status
  END as estado
FROM memberships
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'::uuid
ORDER BY created_at DESC;

-- 8️⃣ VERIFICAR QUE LA TABLA ESTÁ CORRECTA
SELECT '✅ Tabla memberships configurada correctamente' AS result;

