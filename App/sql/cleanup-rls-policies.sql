-- =====================================================
-- LIMPIEZA COMPLETA DE POLÍTICAS RLS CONFLICTIVAS
-- =====================================================

-- Paso 1: Deshabilitamos RLS temporalmente para limpiar
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminamos TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Drivers can self-register" ON public.users;
DROP POLICY IF EXISTS "Drivers can view own profile" ON public.users;
DROP POLICY IF EXISTS "Drivers can update own profile" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "admins_select_all_users" ON public.users;
DROP POLICY IF EXISTS "admins_insert_users" ON public.users;
DROP POLICY IF EXISTS "admins_update_all_users" ON public.users;
DROP POLICY IF EXISTS "admins_delete_users" ON public.users;
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert their profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "rls_users_select_own" ON public.users;
DROP POLICY IF EXISTS "rls_users_select_admin" ON public.users;
DROP POLICY IF EXISTS "rls_users_insert_own" ON public.users;
DROP POLICY IF EXISTS "rls_users_insert_admin" ON public.users;
DROP POLICY IF EXISTS "rls_users_update_own" ON public.users;
DROP POLICY IF EXISTS "rls_users_update_admin" ON public.users;
DROP POLICY IF EXISTS "rls_users_delete_admin" ON public.users;

-- Paso 3: Volvemos a habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Paso 4: Verificamos que no hay políticas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' ORDER BY policyname;

-- Paso 5: Log de éxito
DO $$
BEGIN
  RAISE LOG 'Limpieza completada. Todas las políticas RLS de usuarios fueron eliminadas.';
  RAISE LOG 'Ahora ejecuta el script create-users-table-with-rls.sql para crear las nuevas políticas.';
END $$;
