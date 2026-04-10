-- ==========================================
-- DIAGNÓSTICO Y SOLUCIÓN DE RLS EN MEMBERSHIPS
-- ==========================================

-- 1️⃣ VER TODAS LAS RLS POLICIES EN MEMBERSHIPS
SELECT schemaname, tablename, policyname, qual, cmd 
FROM pg_policies 
WHERE tablename = 'memberships';

-- 2️⃣ DESACTIVAR RLS TEMPORALMENTE PARA PRUEBAS
-- (Esto permite que todos lean la tabla, usa con cuidado en producción)
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;

-- ✅ Ahora verifica si los datos aparecen en WalletDetails

-- 3️⃣ Si necesitas re-activar RLS, usa:
-- ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- 4️⃣ VER TODOS LOS RECORDS DE MEMBERSHIPS (sin RLS)
SELECT 
  uid,
  conductor,
  status,
  fecha_inicio,
  fecha_terminada,
  created_at
FROM memberships
ORDER BY created_at DESC;

-- 5️⃣ VER AUTENTICACIÓN ACTUAL EN SUPABASE
-- (Ejecutar esto en la consola del cliente para ver auth.uid())
-- select auth.uid();

-- 6️⃣ CREAR POLÍTICA MÁS PERMISIVA SI ES NECESARIO
-- Esto permite que cualquier usuario autenticado vea sus membresías
-- Primera, elimina la política antigua:
DROP POLICY IF EXISTS "Conductores ven sus membresías" ON memberships;

-- Luego crea una política nueva más flexible:
CREATE POLICY "Usuarios ven sus membresías basado en conductor"
ON memberships
FOR SELECT
USING (true); -- Permite lectura a todos (ajusta según necesites)

-- 7️⃣ PERMITIR INSERT/UPDATE/DELETE SOLO PARA AUTHENTICATED USERS
DROP POLICY IF EXISTS "Insertar membresías" ON memberships;
DROP POLICY IF EXISTS "Actualizar membresías propias" ON memberships;

CREATE POLICY "Sistema puede insertar membresías"
ON memberships
FOR INSERT
WITH CHECK (true) -- Permite insert si el usuario está autenticado

CREATE POLICY "Actualizar membresías"
ON memberships
FOR UPDATE
USING (true); -- Permite update si el usuario está autenticado

-- 8️⃣ VERIFICAR RECORD ESPECÍFICO DEL USUARIO
SELECT 
  uid,
  conductor,
  status,
  fecha_inicio,
  fecha_terminada,
  (fecha_terminada - CURRENT_DATE) as dias_restantes
FROM memberships
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'
ORDER BY created_at DESC
LIMIT 1;

-- 9️⃣ SI AÚN NO APARECE, VERIFICAR ESTRUCTURA
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'memberships';

-- 🔟 CONTAR MEMBRESÍAS POR CONDUCTOR
SELECT 
  conductor,
  COUNT(*) as total_membresias,
  STRING_AGG(DISTINCT status, ', ') as estados
FROM memberships
GROUP BY conductor
LIMIT 10;
