-- ==========================================
-- ACTUALIZAR COSTO DE MEMBRESÍA A 157200
-- ==========================================

-- 1️⃣ ACTUALIZAR MEMBRESÍAS EXISTENTES
UPDATE memberships
SET costo = 157200
WHERE costo = 90600;

-- 2️⃣ VERIFICAR CAMBIOS
SELECT 
  uid,
  conductor,
  status,
  costo,
  fecha_inicio,
  fecha_terminada
FROM memberships
ORDER BY updated_at DESC
LIMIT 5;

-- 3️⃣ CAMBIAR DEFAULT DE LA TABLA (para nuevas membresías)
ALTER TABLE memberships 
ALTER COLUMN costo SET DEFAULT 157200;

-- 4️⃣ VERIFICAR QUE EL DEFAULT CAMBIÓ
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'memberships' AND column_name = 'costo';
