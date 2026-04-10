-- ==========================================
-- DESACTIVAR RLS EN MEMBERSHIPS PARA REST API
-- ==========================================

-- 1️⃣ VER ESTADO ACTUAL DE RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'memberships';

-- 2️⃣ DESACTIVAR RLS (permite que REST API lea sin restricciones)
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;

-- 3️⃣ VERIFICA QUE SE DESACTIVÓ
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'memberships';

-- 4️⃣ CONFIRMA QUE LOS DATOS EXISTEN
SELECT 
  uid, 
  conductor, 
  status, 
  fecha_inicio,
  fecha_terminada
FROM memberships
LIMIT 10;

-- 5️⃣ PRUEBA: Consulta el conductor específico
SELECT * FROM memberships 
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'::UUID;

-- 6️⃣ DESPUÉS de que funcione, SI necesitas re-habilitar RLS:
-- ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
-- Pero probablemente querrás dejarlo deshabilitado en tabla memberships
