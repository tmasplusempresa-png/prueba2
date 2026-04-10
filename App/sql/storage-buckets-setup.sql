-- =====================================================
-- STORAGE BUCKETS SETUP (SUPABASE)
-- Ejecutar en SQL Editor de Supabase
-- =====================================================

-- 1) Crear/actualizar buckets requeridos
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('vehicle-images', 'vehicle-images', true),
  ('vehicle-documents', 'vehicle-documents', false),
  ('driver-documents', 'driver-documents', false),
  ('booking-media', 'booking-media', false),
  ('user-profiles', 'user-profiles', true),
  ('user-documents', 'user-documents', false)
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- 2) Limpiar políticas previas (idempotente)
DO $$
BEGIN
  -- vehicle-images
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle-images public read') THEN
    DROP POLICY "vehicle-images public read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle-images authenticated write') THEN
    DROP POLICY "vehicle-images authenticated write" ON storage.objects;
  END IF;

  -- user-profiles
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'user-profiles public read') THEN
    DROP POLICY "user-profiles public read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'user-profiles authenticated write') THEN
    DROP POLICY "user-profiles authenticated write" ON storage.objects;
  END IF;

  -- user-documents
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'user-documents authenticated read') THEN
    DROP POLICY "user-documents authenticated read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'user-documents authenticated write') THEN
    DROP POLICY "user-documents authenticated write" ON storage.objects;
  END IF;

  -- vehicle-documents
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle-documents authenticated read') THEN
    DROP POLICY "vehicle-documents authenticated read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle-documents authenticated write') THEN
    DROP POLICY "vehicle-documents authenticated write" ON storage.objects;
  END IF;

  -- driver-documents
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'driver-documents authenticated read') THEN
    DROP POLICY "driver-documents authenticated read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'driver-documents authenticated write') THEN
    DROP POLICY "driver-documents authenticated write" ON storage.objects;
  END IF;

  -- booking-media
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'booking-media authenticated read') THEN
    DROP POLICY "booking-media authenticated read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'booking-media authenticated write') THEN
    DROP POLICY "booking-media authenticated write" ON storage.objects;
  END IF;
END$$;

-- 3) Políticas nuevas

-- vehicle-images (público lectura, autenticados escritura)
CREATE POLICY "vehicle-images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

CREATE POLICY "vehicle-images authenticated write"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'vehicle-images')
WITH CHECK (bucket_id = 'vehicle-images');

-- user-profiles (público lectura, autenticados escritura)
CREATE POLICY "user-profiles public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profiles');

CREATE POLICY "user-profiles authenticated write"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'user-profiles')
WITH CHECK (bucket_id = 'user-profiles');

-- user-documents (privado)
CREATE POLICY "user-documents authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-documents');

CREATE POLICY "user-documents authenticated write"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'user-documents')
WITH CHECK (bucket_id = 'user-documents');

-- vehicle-documents (privado)
CREATE POLICY "vehicle-documents authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'vehicle-documents');

CREATE POLICY "vehicle-documents authenticated write"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'vehicle-documents')
WITH CHECK (bucket_id = 'vehicle-documents');

-- driver-documents (privado)
CREATE POLICY "driver-documents authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'driver-documents');

CREATE POLICY "driver-documents authenticated write"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');

-- booking-media (privado)
CREATE POLICY "booking-media authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'booking-media');

CREATE POLICY "booking-media authenticated write"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'booking-media')
WITH CHECK (bucket_id = 'booking-media');

-- =====================================================
-- Fin
-- =====================================================
