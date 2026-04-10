-- ==========================================
-- SCRIPTS PARA ACTIVAR/DESACTIVAR MEMBRESÍAS
-- ==========================================

-- 1️⃣  ACTIVAR MEMBRESÍA POR ID DEL CONDUCTOR
-- Uso: Reemplaza 'conductor_uid_aqui' con el UID real
UPDATE memberships
SET status = 'ACTIVA'
WHERE conductor = 'conductor_uid_aqui';

---

-- 2️⃣  DESACTIVAR (CANCELAR) MEMBRESÍA POR ID DEL CONDUCTOR
UPDATE memberships
SET status = 'CANCELADA'
WHERE conductor = 'conductor_uid_aqui';

---

-- 3️⃣  ACTIVAR MEMBRESÍA POR UID DE MEMBRESÍA
UPDATE memberships
SET status = 'ACTIVA'
WHERE uid = 'membership_uid_aqui';

---

-- 4️⃣  DESACTIVAR (CANCELAR) MEMBRESÍA POR UID DE MEMBRESÍA
UPDATE memberships
SET status = 'CANCELADA'
WHERE uid = 'membership_uid_aqui';

---

-- 5️⃣  ACTIVAR TODAS LAS MEMBRESÍAS QUE ESTÁN EXPIRADAS PERO PAGADAS
UPDATE memberships
SET status = 'ACTIVA',
    fecha_terminada = CURRENT_DATE + INTERVAL '30 days'
WHERE status IN ('CANCELADA', 'EXPIRADA', 'PENDIENTE')
  AND conductor = 'conductor_uid_aqui';

---

-- 6️⃣  VER ESTADO ACTUAL DE MEMBRESÍAS DE UN CONDUCTOR
SELECT 
  uid,
  conductor,
  status,
  costo,
  fecha_inicio,
  fecha_terminada,
  CASE 
    WHEN fecha_terminada < CURRENT_DATE THEN 'EXPIRADA'
    WHEN fecha_terminada = CURRENT_DATE THEN 'HOY VENCE'
    WHEN fecha_terminada BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'VENCE PRONTO'
    ELSE 'VIGENTE'
  END as estado_real
FROM memberships
WHERE conductor = 'conductor_uid_aqui'
ORDER BY fecha_terminada DESC;

---

-- 7️⃣  BUSCAR MEMBRESÍA POR EMAIL DEL USUARIO
SELECT 
  m.uid,
  m.conductor,
  m.status,
  m.fecha_inicio,
  m.fecha_terminada,
  u.email
FROM memberships m
JOIN users u ON m.conductor = u.id
WHERE u.email = 'usuario@email.com';

---

-- 8️⃣  ACTIVAR Y RENOVAR MEMBRESÍA A 30 DÍAS DESDE HOY
UPDATE memberships
SET 
  status = 'ACTIVA',
  fecha_inicio = CURRENT_DATE,
  fecha_terminada = CURRENT_DATE + INTERVAL '30 days'
WHERE uid = 'membership_uid_aqui';

---

-- 9️⃣  VER TODAS LAS MEMBRESÍAS ACTIVAS
SELECT 
  uid,
  conductor,
  status,
  fecha_inicio,
  fecha_terminada,
  (fecha_terminada - CURRENT_DATE) as dias_restantes
FROM memberships
WHERE status = 'ACTIVA'
ORDER BY fecha_terminada ASC;

---

-- 🔟 VER TODAS LAS MEMBRESÍAS CANCELADAS O EXPIRADAS
SELECT 
  uid,
  conductor,
  status,
  fecha_terminada
FROM memberships
WHERE status IN ('CANCELADA', 'EXPIRADA')
ORDER BY fecha_terminada DESC;

---

-- 1️⃣1️⃣ DESACTIVAR MÚLTIPLES MEMBRESÍAS (LISTA)
-- Reemplaza los UIDs en esta lista
UPDATE memberships
SET status = 'CANCELADA'
WHERE uid IN (
  'uid_1',
  'uid_2',
  'uid_3',
  'uid_4'
);

---

-- 1️⃣2️⃣ ESTADÍSTICAS DE MEMBRESÍAS
SELECT 
  status,
  COUNT(*) as total,
  COUNT(DISTINCT conductor) as conductores_unicos,
  SUM(costo) as ingreso_total,
  AVG(costo) as costo_promedio
FROM memberships
GROUP BY status;

---

-- 1️⃣3️⃣ REACTIVAR MEMBRESÍA Y EXTENDER 90 DÍAS MÁS
UPDATE memberships
SET 
  status = 'ACTIVA',
  fecha_terminada = GREATEST(
    fecha_terminada, 
    CURRENT_DATE
  ) + INTERVAL '90 days'
WHERE conductor = 'conductor_uid_aqui'
  AND status != 'ACTIVA';

---

-- 1️⃣4️⃣ BUSCAR CONDUCTORES SIN MEMBRESÍA
SELECT DISTINCT u.id, u.email
FROM users u
LEFT JOIN memberships m ON u.id = m.conductor
WHERE m.uid IS NULL
  OR u.id NOT IN (
    SELECT DISTINCT conductor 
    FROM memberships 
    WHERE status = 'ACTIVA'
  );

---

-- 1️⃣5️⃣ TRANSACCIÓN SEGURA: ACTIVAR MÚLTIPLES Y REGISTRAR CAMBIOS
BEGIN;

-- Guardar cambios en tabla de auditoría (si existe)
INSERT INTO memberships_audit (conductor, status_anterior, status_nuevo, fecha_cambio)
SELECT conductor, status, 'ACTIVA', NOW()
FROM memberships
WHERE conductor IN ('conductor_uid_1', 'conductor_uid_2');

-- Actualizar membresías
UPDATE memberships
SET status = 'ACTIVA'
WHERE conductor IN ('conductor_uid_1', 'conductor_uid_2');

COMMIT;

