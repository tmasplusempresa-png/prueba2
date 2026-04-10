-- ============================================
-- SCRIPT DE VERIFICACIÓN DE USUARIOS
-- ============================================
-- Usa este script para verificar si los usuarios están 
-- correctamente registrados en ambas tablas

-- 1. CONTAR usuarios en auth.users vs tabla users pública
SELECT 
  'auth.users' AS tabla,
  COUNT(*) AS total_usuarios
FROM auth.users
UNION ALL
SELECT 
  'public.users' AS tabla,
  COUNT(*) AS total_usuarios
FROM public.users;

-- 2. ENCONTRAR usuarios en auth.users que NO están en public.users
SELECT 
  au.id,
  au.email,
  au.created_at,
  'Usuario en auth pero NO en tabla users' AS estado
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- 3. ENCONTRAR usuarios en public.users que NO están en auth.users
SELECT 
  pu.id,
  pu.email,
  pu.created_at,
  'Usuario en tabla users pero NO en auth' AS estado
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL
ORDER BY pu.created_at DESC;

-- 4. VER últimos 10 usuarios en ambas tablas (comparación lado a lado)
SELECT 
  au.id AS auth_id,
  au.email AS auth_email,
  au.created_at AS auth_created,
  pu.id AS users_id,
  pu.email AS users_email,
  pu.first_name,
  pu.last_name,
  pu.user_type,
  pu.created_at AS users_created,
  CASE 
    WHEN pu.id IS NOT NULL THEN '✅ Sincronizado'
    ELSE '❌ Falta en tabla users'
  END AS estado
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 5. BUSCAR un usuario específico por EMAIL
-- (Reemplaza 'usuario@ejemplo.com' con el email que quieres buscar)
SELECT 
  'auth.users' AS tabla,
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data::text AS metadata
FROM auth.users au
WHERE au.email = 'usuario@ejemplo.com'
UNION ALL
SELECT 
  'public.users' AS tabla,
  pu.id,
  pu.email,
  pu.created_at,
  jsonb_build_object(
    'first_name', pu.first_name,
    'last_name', pu.last_name,
    'mobile', pu.mobile,
    'user_type', pu.user_type
  )::text AS metadata
FROM public.users pu
WHERE pu.email = 'usuario@ejemplo.com';

-- 6. BUSCAR un usuario específico por TELÉFONO
-- (Reemplaza '+573001234567' con el teléfono que quieres buscar)
SELECT 
  pu.id,
  pu.email,
  pu.first_name,
  pu.last_name,
  pu.mobile,
  pu.user_type,
  pu.created_at
FROM public.users pu
WHERE pu.mobile = '+573001234567';

-- 7. MIGRAR manualmente un usuario de auth a users (si falta)
-- (Reemplaza 'USER_ID_AQUI' con el ID del usuario de auth.users)

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
SELECT 
  au.id,
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Sin nombre'),
  COALESCE(au.raw_user_meta_data->>'last_name', 'Sin apellido'),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  COALESCE(au.raw_user_meta_data->>'usertype', 'customer'),
  false,
  false,
  false,
  false,
  0,
  0,
  0
FROM auth.users au
WHERE au.id = 'USER_ID_AQUI'
  AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = au.id
  );


-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecuta las queries 1-4 para obtener un panorama general
-- 2. Usa la query 5 o 6 para buscar usuarios específicos
-- 3. Si encuentras usuarios en auth que no están en users,
--    descomenta y ejecuta la query 7 para migrarlos
-- ============================================
