-- =====================================================
-- VERIFY STORAGE BUCKETS & POLICIES
-- Ejecutar después de storage-buckets-setup.sql
-- =====================================================

-- 1) Verificar buckets requeridos
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id IN (
  'vehicle-images',
  'vehicle-documents',
  'driver-documents',
  'booking-media',
  'user-profiles',
  'user-documents'
)
ORDER BY id;

-- 2) Verificar conteo esperado (debe dar 6)
SELECT COUNT(*) AS required_buckets_found
FROM storage.buckets
WHERE id IN (
  'vehicle-images',
  'vehicle-documents',
  'driver-documents',
  'booking-media',
  'user-profiles',
  'user-documents'
);

-- 3) Verificar políticas creadas
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE 'vehicle-images%' OR
    policyname LIKE 'vehicle-documents%' OR
    policyname LIKE 'driver-documents%' OR
    policyname LIKE 'booking-media%' OR
    policyname LIKE 'user-profiles%' OR
    policyname LIKE 'user-documents%'
  )
ORDER BY policyname;

-- 4) Verificar objetos por bucket (si existen)
SELECT bucket_id, COUNT(*) AS total_objects
FROM storage.objects
WHERE bucket_id IN (
  'vehicle-images',
  'vehicle-documents',
  'driver-documents',
  'booking-media',
  'user-profiles',
  'user-documents'
)
GROUP BY bucket_id
ORDER BY bucket_id;

-- =====================================================
-- Fin
-- =====================================================
