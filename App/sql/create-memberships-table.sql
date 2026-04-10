-- ==========================================
-- CREAR TABLA MEMBERSHIPS EN SUPABASE
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

-- 2️⃣ CREAR ÍNDICES PARA MEJOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_memberships_conductor ON memberships(conductor);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_fecha_terminada ON memberships(fecha_terminada);

-- 3️⃣ HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- 4️⃣ CREAR POLÍTICAS DE SEGURIDAD
-- Los conductores solo ven sus propias membresías
CREATE POLICY "Conductores ven sus membresías" 
ON memberships 
FOR SELECT 
USING (conductor = auth.uid());

-- Solo administradores o el sistema pueden insertar
CREATE POLICY "Insertar membresías" 
ON memberships 
FOR INSERT 
WITH CHECK (conductor = auth.uid());

-- Solo el propietario o admin puede actualizar
CREATE POLICY "Actualizar membresías propias" 
ON memberships 
FOR UPDATE 
USING (conductor = auth.uid());

-- 5️⃣ CREAR TABLA DE AUDITORÍA (OPCIONAL)
CREATE TABLE IF NOT EXISTS memberships_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conductor UUID NOT NULL,
  membership_uid UUID REFERENCES memberships(uid),
  status_anterior VARCHAR(20),
  status_nuevo VARCHAR(20),
  fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  razon TEXT
);

-- 6️⃣ VERIFICAR QUE LA TABLA FUE CREADA
SELECT '✅ Tabla memberships creada correctamente' AS resultado;

-- ==========================================
-- SCRIPT PARA ACTIVAR MEMBRESÍA
-- ==========================================

-- 7️⃣ ACTIVAR MEMBRESÍA POR CONDUCTOR UID
UPDATE memberships
SET 
  status = 'ACTIVA',
  updated_at = CURRENT_TIMESTAMP
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'
  AND status != 'ACTIVA'
RETURNING uid, conductor, status, fecha_terminada;

-- 8️⃣ VERIFICAR QUE SE ACTIVÓ
SELECT 
  uid,
  conductor,
  status,
  costo,
  fecha_inicio,
  fecha_terminada,
  (fecha_terminada - CURRENT_DATE) as dias_restantes
FROM memberships
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'
ORDER BY fecha_terminada DESC
LIMIT 1;

-- 9️⃣ ALTERNATIVA: SI YA EXISTE MEMBRESÍA, RENOVARLA A 30 DÍAS
UPDATE memberships
SET 
  status = 'ACTIVA',
  fecha_terminada = CURRENT_DATE + INTERVAL '30 days',
  updated_at = CURRENT_TIMESTAMP
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'
RETURNING uid, status, fecha_terminada;

-- 🔟 VER TODAS LAS MEMBRESÍAS DE UN CONDUCTOR
SELECT 
  uid,
  conductor,
  status,
  costo,
  fecha_inicio,
  fecha_terminada,
  CASE 
    WHEN status = 'ACTIVA' AND fecha_terminada >= CURRENT_DATE THEN 'ACTIVA Y VIGENTE'
    WHEN status = 'ACTIVA' AND fecha_terminada < CURRENT_DATE THEN 'ACTIVA PERO EXPIRADA'
    ELSE status
  END as estado_real,
  (fecha_terminada - CURRENT_DATE) as dias_restantes
FROM memberships
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'
ORDER BY created_at DESC;

