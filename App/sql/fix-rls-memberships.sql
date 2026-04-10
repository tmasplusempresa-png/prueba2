-- ==========================================
-- SOLUCIÓN TEMPORAL: DESACTIVAR RLS EN MEMBERSHIPS
-- ==========================================
-- Si el problema es RLS, esta consulta permitirá que funcione temporalmente

-- 1️⃣ DESACTIVAR ROW LEVEL SECURITY COMPLETAMENTE
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;

-- Después ejecuta esto, prueba en la app y mira los logs

-- 2️⃣ SI NECESITAS RE-ACTIVAR PERO CON POLÍTICA MÁS FLEXIBLE:
-- ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Conductores ven sus membresías" ON memberships;
-- CREATE POLICY "Cualquier usuario autenticado puede leer sus membresías"
-- ON memberships
-- FOR SELECT
-- USING (conductor = auth.uid());

-- 3️⃣ VERIFICA QUE LOS DATOS EXISTEN
SELECT 
  uid,
  conductor,
  status,
  fecha_inicio,
  fecha_terminada,
  created_at
FROM memberships
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'
ORDER BY created_at DESC;

-- 4️⃣ VERIFICA TODAS LAS POLÍTICAS ACTUALES
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'memberships'
ORDER BY policyname;
