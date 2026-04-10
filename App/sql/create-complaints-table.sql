-- =====================================================
-- TABLA DE QUEJAS Y RECLAMOS
-- =====================================================
-- Datos capturados desde ComplainScreen.tsx:
--   • complaint_type  → tipo de solicitud (queja, reclamo, sugerencia, otro)
--   • subject         → asunto (max 80 chars en UI)
--   • body            → mensaje detallado (max 500 chars en UI)
--   • priority        → prioridad (baja, media, alta)
--   • evidence_urls   → imágenes adjuntas (JSON array de URLs al bucket)
--   • status          → estado de gestión (pending → in_review → resolved → rejected)
--   • admin_response  → respuesta del administrador
--   • user_id         → FK a users (reemplaza datos denormalizados)
--   • booking_id      → FK opcional a bookings (quejas ligadas a un viaje)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.complaints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con el usuario que crea la queja
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Relación opcional con un viaje específico
  booking_id      UUID REFERENCES public.bookings(id) ON DELETE SET NULL,

  -- Datos del formulario
  complaint_type  VARCHAR(20) NOT NULL
                    CHECK (complaint_type IN ('queja', 'reclamo', 'sugerencia', 'otro'))
                    DEFAULT 'queja',
  subject         VARCHAR(120) NOT NULL,
  body            TEXT NOT NULL,
  priority        VARCHAR(10) NOT NULL
                    CHECK (priority IN ('baja', 'media', 'alta'))
                    DEFAULT 'media',

  -- Evidencia adjunta (array de URLs al storage bucket)
  evidence_urls   JSONB DEFAULT '[]'::jsonb,

  -- Gestión y resolución
  status          VARCHAR(20) NOT NULL
                    CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected'))
                    DEFAULT 'pending',
  admin_response  TEXT,
  resolved_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Buscar quejas por usuario (pantalla de historial)
CREATE INDEX IF NOT EXISTS idx_complaints_user_id
  ON public.complaints(user_id);

-- Buscar quejas por booking (incidentes de viaje)
CREATE INDEX IF NOT EXISTS idx_complaints_booking_id
  ON public.complaints(booking_id);

-- Filtrar por estado (panel admin)
CREATE INDEX IF NOT EXISTS idx_complaints_status
  ON public.complaints(status);

-- Ordenar por fecha de creación (más recientes primero)
CREATE INDEX IF NOT EXISTS idx_complaints_created_at
  ON public.complaints(created_at DESC);

-- Filtrar por tipo y prioridad (panel admin)
CREATE INDEX IF NOT EXISTS idx_complaints_type_priority
  ON public.complaints(complaint_type, priority);

-- =====================================================
-- TRIGGER: actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_complaints_updated_at ON public.complaints;
CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_complaints_updated_at();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Los usuarios autenticados pueden ver sus propias quejas
CREATE POLICY "Users can view own complaints"
  ON public.complaints
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Los usuarios autenticados pueden crear quejas propias
CREATE POLICY "Users can insert own complaints"
  ON public.complaints
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar sus propias quejas (ej: agregar evidencia)
CREATE POLICY "Users can update own complaints"
  ON public.complaints
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

-- Los admins pueden ver y gestionar todas las quejas
CREATE POLICY "Admins can manage all complaints"
  ON public.complaints
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND user_type = 'admin'
    )
  );

-- =====================================================
-- BUCKET DE STORAGE PARA EVIDENCIA (opcional)
-- =====================================================
-- Ejecutar en SQL Editor de Supabase:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('complaint-evidence', 'complaint-evidence', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "Users can upload complaint evidence"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'complaint-evidence'
--     AND auth.role() = 'authenticated'
--   );
--
-- CREATE POLICY "Users can view own complaint evidence"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'complaint-evidence'
--     AND auth.role() = 'authenticated'
--   );
