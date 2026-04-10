-- ==========================================
-- CREAR FUNCIÓN RPC PARA OBTENER MEMBERSHIPS
-- ==========================================
-- Esta función RPC es accesible sin problemas de RLS

-- 1️⃣ CREAR FUNCIÓN RPC
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

-- 2️⃣ OTORGAR PERMISOS
GRANT EXECUTE ON FUNCTION get_my_memberships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_memberships(UUID) TO anon;

-- 3️⃣ PRUEBA
-- SELECT * FROM get_my_memberships('fd8fec1a-6660-4357-ad4f-a0372f43a1ae');

-- 4️⃣ SI NECESITAS ELIMINAR LA FUNCIÓN ANTERIOR
-- DROP FUNCTION IF EXISTS get_my_memberships(UUID);
