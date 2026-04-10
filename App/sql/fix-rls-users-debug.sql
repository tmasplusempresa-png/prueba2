-- =====================================================
-- DEBUG Y REPARACIÓN: Políticas RLS para users
-- =====================================================

-- 1. Ver cuántos usuarios tienen registro en public.users
SELECT 
  'Usuarios en auth.users' as stat,
  COUNT(*) as cantidad
FROM auth.users
UNION ALL
SELECT 
  'Usuarios en public.users' as stat,
  COUNT(*) as cantidad
FROM public.users;

-- 2. Ver si hay auth.users sin registro en public.users
SELECT 
  au.id as auth_id,
  au.email,
  CASE WHEN pu.id IS NULL THEN 'MISSING' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_id
ORDER BY au.created_at DESC
LIMIT 10;

-- 3. Verificar las políticas RLS actuales
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

-- =====================================================
-- POLÍTICA TEMPORAL PARA DEBUG: Permitir SELECT sin restricciones
-- =====================================================

DROP POLICY IF EXISTS "rls_users_select_own" ON public.users;
DROP POLICY IF EXISTS "rls_users_select_admin" ON public.users;
DROP POLICY IF EXISTS "rls_users_select_debug" ON public.users;

-- Política temporal: Cualquier usuario autenticado puede leer su propio registro
CREATE POLICY "rls_users_select_debug"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = auth_id::text);

-- =====================================================
-- POLÍTICA TEMPORAL PARA INSERT: Permitir que se cree registro automáticamente
-- =====================================================

-- Asegurar que el trigger CREATE OR REPLACE está bien
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  RAISE LOG '[TRIGGER handle_new_user] New auth user: % - user_type: %', 
    NEW.id, NEW.raw_user_meta_data->>'user_type';
  
  INSERT INTO public.users (auth_id, email, first_name, last_name, user_type, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer'),
    true
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = NEW.email,
    first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', users.first_name),
    last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', users.last_name),
    user_type = COALESCE(NEW.raw_user_meta_data->>'user_type', users.user_type),
    updated_at = NOW();
  
  RAISE LOG '[TRIGGER handle_new_user] User record created/updated for %', NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recrear el trigger para asegurar que está activo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- INSERTAR MANUALMENTE USUARIOS FALTANTES (CRÍTICO PARA DEBUG)
-- =====================================================

-- Solo si no existen registros en public.users
DO $$
DECLARE
  missing_users_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO missing_users_count
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.auth_id
  WHERE pu.id IS NULL;
  
  IF missing_users_count > 0 THEN
    RAISE LOG 'Encontrados % usuarios sin registro en public.users. Creando registros...', missing_users_count;
    
    INSERT INTO public.users (auth_id, email, first_name, last_name, user_type, is_active)
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'first_name', 'User'),
      COALESCE(au.raw_user_meta_data->>'last_name', ''),
      COALESCE(au.raw_user_meta_data->>'user_type', 'customer'),
      true
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.auth_id
    WHERE pu.id IS NULL
    ON CONFLICT (auth_id) DO NOTHING;
    
    RAISE LOG 'Registros creados exitosamente';
  ELSE
    RAISE LOG 'Todos los usuarios en auth.users tienen registro en public.users';
  END IF;
END $$;

-- =====================================================
-- VALIDACIÓN FINAL
-- =====================================================

SELECT COUNT(*) as total_users_synced
FROM auth.users au
JOIN public.users pu ON au.id = pu.auth_id;

-- Confirmación
DO $$
BEGIN
  RAISE LOG 'Script de debug ejecutado. Las políticas RLS de SELECT están temporalmente simplificadas para permitir acceso.';
END $$;
