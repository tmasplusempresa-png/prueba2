-- ==========================================
-- VERIFICAR FUNCIÓN RPC Y DIAGNOSTICAR
-- ==========================================

-- 1️⃣ VERIFICAR SI LA FUNCIÓN EXISTE
SELECT 
  routine_schema,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'get_my_memberships'
ORDER BY routine_schema;

-- 2️⃣ SI NO EXISTE, CREARLA AQUÍ
-- Si el query anterior retorna filas, salta este paso
-- Si retorna vacío, copia el siguiente SQL y ejecútalo:

CREATE OR REPLACE FUNCTION get_my_memberships(conductor_id UUID)
RETURNS TABLE (
  uid UUID,
  conductor UUID,
  status VARCHAR,
  costo NUMERIC,
  fecha_inicio DATE,
  fecha_terminada DATE,
  periodo INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.uid,
    m.conductor,
    m.status,
    m.costo,
    m.fecha_inicio,
    m.fecha_terminada,
    m.periodo,
    m.created_at,
    m.updated_at
  FROM memberships m
  WHERE m.conductor = conductor_id
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3️⃣ VERIFICAR PERMISOS
GRANT EXECUTE ON FUNCTION get_my_memberships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_memberships(UUID) TO anon;

-- 4️⃣ PROBAR LA FUNCIÓN CON EL UID ESPECÍFICO
SELECT * FROM get_my_memberships('fd8fec1a-6660-4357-ad4f-a0372f43a1ae'::UUID);

-- 5️⃣ VER TODOS LOS DATOS EN MEMBERSHIPS (SIN RLS)
SELECT * FROM memberships LIMIT 10;

-- 6️⃣ VER DATOS DEL CONDUCTOR ESPECÍFICO
SELECT 
  uid,
  conductor,
  status,
  fecha_inicio,
  fecha_terminada
FROM memberships
WHERE conductor = 'fd8fec1a-6660-4357-ad4f-a0372f43a1ae'::UUID;
