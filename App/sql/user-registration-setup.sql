-- ============================================
-- CONFIGURACIÓN DE REGISTRO DE USUARIOS
-- ============================================
-- Este script asegura que cuando un usuario se registra en auth.users,
-- también se cree automáticamente en la tabla pública users

-- 1. Verificar si existe el trigger actual
SELECT 
    trigger_name, 
    event_object_table, 
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%user%'
  AND event_object_schema = 'auth';

-- 2. Crear función que maneja la inserción automática en users
-- (se ejecuta cuando se crea un usuario en auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insertar en tabla users pública
  INSERT INTO public.users (
    id,
    auth_id,
    email,
    first_name,
    last_name,
    mobile,
    user_type,
    approved,
    blocked,
    is_verified,
    driver_active_status,
    wallet_balance,
    rating,
    total_rides
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'usertype', 'customer'),
    false,
    false,
    false,
    false,
    0,
    0,
    0
  );
  
  RETURN NEW;
END;
$$;

-- 3. Crear trigger en auth.users para ejecutar la función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Habilitar RLS (Row Level Security) en tabla users si no está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas de acceso
-- Política: Los usuarios pueden ver su propio registro
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio registro
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Política: Permitir inserción para usuarios autenticados (usado por el trigger)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
CREATE POLICY "Enable insert for authenticated users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Verificar que todo quedó configurado correctamente
SELECT 
    'Trigger configurado: ' || trigger_name AS status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- INSTRUCCIONES DE USO:
-- ============================================
-- 1. Copia todo este script
-- 2. Ve a tu proyecto en Supabase Dashboard
-- 3. Abre SQL Editor desde el menú lateral
-- 4. Pega el script y haz clic en "Run"
-- 5. Verifica que no haya errores
-- 6. Prueba creando un nuevo usuario desde la app
-- 7. Revisa en Table Editor > users que el usuario se creó automáticamente
-- ============================================
