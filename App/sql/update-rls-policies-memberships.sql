-- ==========================================
-- ACTUALIZAR RLS POLICIES EN MEMBERSHIPS
-- ==========================================

-- 1️⃣ ELIMINAR TODAS LAS POLÍTICAS ANTIGUAS
DROP POLICY IF EXISTS "Conductores ven sus membresías" ON memberships;
DROP POLICY IF EXISTS "Insertar membresías" ON memberships;
DROP POLICY IF EXISTS "Actualizar membresías propias" ON memberships;
DROP POLICY IF EXISTS "Lectura de membresías" ON memberships;
DROP POLICY IF EXISTS "Sistema puede insertar membresías" ON memberships;
DROP POLICY IF EXISTS "Actualizar membresías" ON memberships;

-- 2️⃣ ASEGURAR QUE ROW LEVEL SECURITY ESTÁ ACTIVADO
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- 3️⃣ POLÍTICA DE LECTURA: Cualquier usuario autenticado puede leer sus membresías
CREATE POLICY "Leer membresías propias"
ON memberships
FOR SELECT
USING (
  -- Permitir lectura si el conductor coincide con auth.uid() del usuario autenticado
  conductor = auth.uid()
);

-- 4️⃣ POLÍTICA DE INSERCIÓN: Solo el sistema o usuarios autenticados puede insertar
CREATE POLICY "Insertar membresías propia"
ON memberships
FOR INSERT
WITH CHECK (
  -- Permitir insert si el conductor es el usuario autenticado actual
  conductor = auth.uid()
);

-- 5️⃣ POLÍTICA DE UPDATE: Solo el propietario puede actualizar su membresía
CREATE POLICY "Actualizar membresía propia"
ON memberships
FOR UPDATE
USING (conductor = auth.uid())
WITH CHECK (conductor = auth.uid());

-- 6️⃣ POLÍTICA DE DELETE: Solo el propietario puede eliminar su membresía
CREATE POLICY "Eliminar membresía propia"
ON memberships
FOR DELETE
USING (conductor = auth.uid());

-- 7️⃣ VERIFICAR POLÍTICAS CREADAS
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'memberships'
ORDER BY policyname;

-- 8️⃣ PRUEBA: Verificar que puedes leer los datos
-- (Ejecuta esto como usuario autenticado con UUID: fd8fec1a-6660-4357-ad4f-a0372f43a1ae)
SELECT 
  uid,
  conductor,
  status,
  fecha_inicio,
  fecha_terminada,
  costo
FROM memberships
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'
ORDER BY created_at DESC;

-- 9️⃣ SI AÚN NO FUNCIONA: Verificar datos sin RLS (TEMPORAL)
-- ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
-- SELECT * FROM memberships;
-- Luego:
-- ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
