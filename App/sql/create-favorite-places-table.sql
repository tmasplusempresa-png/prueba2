-- =====================================================
-- TABLA DE LUGARES FAVORITOS
-- =====================================================
-- Datos capturados desde SearchScreen.tsx (Mis Direcciones):
--   • user_id               → FK a users (propietario)
--   • name                  → nombre corto del lugar (nameAddressFavorite)
--   • description           → dirección completa (formatted_address)
--   • latitude / longitude  → coordenadas geográficas
--   • type_address          → categoría (Casa, Trabajo, Gimnasio, etc.)
--   • is_favorite           → marcado como favorito
--   • usage_count           → veces que el usuario ha usado esta dirección
--
-- RESTRICCIÓN: máximo 5 lugares favoritos por usuario.
--   Se aplica mediante trigger + función PL/pgSQL para
--   garantizar la regla a nivel de base de datos.
-- =====================================================

-- 1) Eliminar tabla anterior si existe (saved_addresses básica)
--    Descomentar SOLO si se desea reemplazar la tabla existente:
-- DROP TABLE IF EXISTS public.saved_addresses CASCADE;

CREATE TABLE IF NOT EXISTS public.favorite_places (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con el usuario
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Datos del lugar
  name            VARCHAR(120) NOT NULL,
  description     TEXT NOT NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,

  -- Categoría del lugar
  type_address    VARCHAR(30)
                    CHECK (type_address IN (
                      'Casa', 'Trabajo', 'Gimnasio', 'Supermercado',
                      'Parque', 'Escuela', 'Restaurante', 'Otro'
                    ))
                    DEFAULT 'Otro',

  -- Estado de favorito
  is_favorite     BOOLEAN NOT NULL DEFAULT true,

  -- Contador de uso (cuántas veces se ha usado como destino)
  usage_count     INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Buscar lugares por usuario (pantalla Mis Direcciones)
CREATE INDEX IF NOT EXISTS idx_favorite_places_user_id
  ON public.favorite_places(user_id);

-- Filtrar solo favoritos por usuario
CREATE INDEX IF NOT EXISTS idx_favorite_places_user_favorite
  ON public.favorite_places(user_id, is_favorite)
  WHERE is_favorite = true;

-- Buscar por categoría dentro de un usuario
CREATE INDEX IF NOT EXISTS idx_favorite_places_user_type
  ON public.favorite_places(user_id, type_address);

-- Ordenar por más usados (sugerir primero los frecuentes)
CREATE INDEX IF NOT EXISTS idx_favorite_places_usage
  ON public.favorite_places(user_id, usage_count DESC);

-- Ordenar por fecha (más recientes primero)
CREATE INDEX IF NOT EXISTS idx_favorite_places_created
  ON public.favorite_places(created_at DESC);

-- =====================================================
-- TRIGGER: actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_favorite_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_favorite_places_updated_at ON public.favorite_places;
CREATE TRIGGER trg_favorite_places_updated_at
  BEFORE UPDATE ON public.favorite_places
  FOR EACH ROW
  EXECUTE FUNCTION public.update_favorite_places_updated_at();

-- =====================================================
-- RESTRICCIÓN: MÁXIMO 5 LUGARES FAVORITOS POR USUARIO
-- =====================================================
-- Se valida mediante trigger BEFORE INSERT.
-- Si el usuario ya tiene 5 registros con is_favorite = true,
-- el INSERT se rechaza con excepción.
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_favorite_places_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  IF NEW.is_favorite = true THEN
    SELECT COUNT(*)
      INTO current_count
      FROM public.favorite_places
     WHERE user_id = NEW.user_id
       AND is_favorite = true;

    IF current_count >= 5 THEN
      RAISE EXCEPTION 'Límite alcanzado: máximo 5 lugares favoritos por usuario.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_favorite_limit_insert ON public.favorite_places;
CREATE TRIGGER trg_check_favorite_limit_insert
  BEFORE INSERT ON public.favorite_places
  FOR EACH ROW
  EXECUTE FUNCTION public.check_favorite_places_limit();

-- También validar en UPDATE (si cambia is_favorite de false a true)
DROP TRIGGER IF EXISTS trg_check_favorite_limit_update ON public.favorite_places;
CREATE TRIGGER trg_check_favorite_limit_update
  BEFORE UPDATE ON public.favorite_places
  FOR EACH ROW
  WHEN (OLD.is_favorite = false AND NEW.is_favorite = true)
  EXECUTE FUNCTION public.check_favorite_places_limit();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.favorite_places ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propios lugares
CREATE POLICY "Users can view own favorite places"
  ON public.favorite_places
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Los usuarios pueden crear sus propios lugares
CREATE POLICY "Users can insert own favorite places"
  ON public.favorite_places
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar sus propios lugares
CREATE POLICY "Users can update own favorite places"
  ON public.favorite_places
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar sus propios lugares
CREATE POLICY "Users can delete own favorite places"
  ON public.favorite_places
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Los admins pueden gestionar todos los lugares
CREATE POLICY "Admins can manage all favorite places"
  ON public.favorite_places
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND user_type = 'admin'
    )
  );

-- =====================================================
-- FUNCIÓN HELPER: contar favoritos del usuario actual
-- =====================================================
-- Útil para que el frontend consulte cuántos slots quedan
-- antes de intentar guardar uno nuevo.
--
-- Uso: SELECT public.get_favorite_count('uuid-del-user');
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_favorite_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
    FROM public.favorite_places
   WHERE user_id = p_user_id
     AND is_favorite = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =====================================================
-- DATOS DE EJEMPLO (opcional, descomentar para testing)
-- =====================================================
--
-- INSERT INTO public.favorite_places (user_id, name, description, latitude, longitude, type_address, is_favorite)
-- VALUES
--   ('UUID_DEL_USUARIO', 'Mi Casa',    'Cra 7 #32-16, Bogotá',       4.610356, -74.070546, 'Casa',    true),
--   ('UUID_DEL_USUARIO', 'Oficina',    'Av. Chile #72-31, Bogotá',    4.657191, -74.061318, 'Trabajo', true),
--   ('UUID_DEL_USUARIO', 'Smart Fit',  'Cl. 53 #13-40, Bogotá',      4.641000, -74.066000, 'Gimnasio', true);
