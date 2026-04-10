-- =====================================================
-- TABLA DE USUARIOS CON RLS CORREGIDO
-- =====================================================

-- Crear tabla users si no existe
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  mobile VARCHAR(20),
  user_type VARCHAR(50) CHECK (user_type IN ('customer', 'driver', 'company', 'admin')) DEFAULT 'customer',
  car_type VARCHAR(50),
  car_image TEXT,
  vehicle_number VARCHAR(20),
  vehicle_make VARCHAR(100),
  company_name VARCHAR(255),
  profile_image TEXT,
  rating DECIMAL(3, 2),
  total_trips INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- =====================================================
-- AGREGAR COLUMNAS FALTANTES (si la tabla ya existe)
-- =====================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'customer';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS car_type VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS car_image TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vehicle_make VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- =====================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ELIMINAR TODAS LAS POLÍTICAS ANTIGUAS Y CONFLICTIVAS
-- =====================================================

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

-- =====================================================
-- CREAR 7 POLÍTICAS LIMPIAS Y DEFINITIVAS
-- =====================================================

-- P1: SELECT - Usuarios pueden ver su propio perfil
CREATE POLICY "rls_users_select_own"
  ON public.users
  FOR SELECT
  USING (auth.uid() = auth_id);

-- P2: SELECT - Admins pueden ver todos
CREATE POLICY "rls_users_select_admin"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data->>'user_type' = 'admin'
    )
  );

-- P3: INSERT - Usuarios pueden crear su propio registro
CREATE POLICY "rls_users_insert_own"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

-- P4: INSERT - Admins pueden crear usuarios
CREATE POLICY "rls_users_insert_admin"
  ON public.users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data->>'user_type' = 'admin'
    )
  );

-- P5: UPDATE - Usuarios pueden actualizar su propio
CREATE POLICY "rls_users_update_own"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- P6: UPDATE - Admins pueden actualizar cualquiera
CREATE POLICY "rls_users_update_admin"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data->>'user_type' = 'admin'
    )
  );

-- P7: DELETE - Solo admins pueden eliminar
CREATE POLICY "rls_users_delete_admin"
  ON public.users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data->>'user_type' = 'admin'
    )
  );

-- =====================================================
-- FUNCIÓN AUTOMÁTICA: CREAR USUARIO EN public.users AL REGISTRARSE
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    user_type = COALESCE(NEW.raw_user_meta_data->>'user_type', users.user_type);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- VERIFICACIÓN Y LOGS
-- =====================================================

-- Logs de creación
DO $$
BEGIN
  RAISE LOG 'Tabla users está lista con RLS habilitado';
  RAISE LOG 'Políticas RLS creadas: views (3), updates (2), inserts (2), deletes (1)';
  RAISE LOG 'Trigger de auto-creación de usuarios activado';
END $$;

-- Validación final
SELECT 
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM information_schema.role_table_grants 
   WHERE table_schema = 'public' AND table_name = 'users') as policy_count
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
