-- ============================================================================
-- OPCIONAL / EJECUTAR CON PRECAUCIÓN
-- Migra cars.service_type y cars.features.carType a los nombres canónicos:
--   ConfortPlus · TaxiPlus · VanPlus · XPlus
--
-- ⚠️  service_type la ESCRIBE Y LEE el dashboard web (fuera de este repo).
--     Si el web espera snake_case ('taxi_plus', 'particular', etc.), esta
--     migración puede romperlo o el web la sobrescribirá de vuelta.
--     NO es necesaria para la app móvil: el cliente ya normaliza los nombres
--     al mostrar (common/utils/carType.ts). Ejecuta esto SOLO si confirmaste
--     que el dashboard web también usa/acepta los nombres canónicos.
--
-- Estado actual observado (165 autos):
--   service_type:      particular(93), servicio_especial(61), taxi_plus(8), van_plus(3)
--   features.carType:  T+Plus Particular(30), T+Plus Especial(27), T+Plus Taxi(6),
--                      T+Plus Van(2), TREAS-X(1), NULL(99)
--
-- Recomendado: correr primero el SELECT de previsualización, luego el UPDATE
-- dentro de una transacción para poder revisar antes de COMMIT.
-- ============================================================================

-- 1) PREVISUALIZACIÓN — ver qué cambiaría (no modifica nada)
SELECT
  service_type AS service_type_actual,
  CASE lower(service_type)
    WHEN 'taxi_plus'         THEN 'TaxiPlus'
    WHEN 'van_plus'          THEN 'VanPlus'
    WHEN 'particular'        THEN 'XPlus'
    WHEN 'servicio_especial' THEN 'ConfortPlus'
    ELSE service_type
  END AS service_type_nuevo,
  count(*) AS n
FROM cars
GROUP BY 1, 2
ORDER BY n DESC;

-- 2) MIGRACIÓN — descomenta el bloque para aplicar
-- BEGIN;
--
-- -- service_type (columna canónica)
-- UPDATE cars SET service_type = 'TaxiPlus'    WHERE lower(service_type) = 'taxi_plus';
-- UPDATE cars SET service_type = 'VanPlus'     WHERE lower(service_type) = 'van_plus';
-- UPDATE cars SET service_type = 'XPlus'       WHERE lower(service_type) = 'particular';
-- UPDATE cars SET service_type = 'ConfortPlus' WHERE lower(service_type) = 'servicio_especial';
--
-- -- features.carType (legacy móvil, JSONB)
-- UPDATE cars SET features = jsonb_set(features, '{carType}', '"TaxiPlus"')
--   WHERE features->>'carType' IN ('T+Plus Taxi', 'TREAS-T');
-- UPDATE cars SET features = jsonb_set(features, '{carType}', '"VanPlus"')
--   WHERE features->>'carType' IN ('T+Plus Van', 'TREAS-Van');
-- UPDATE cars SET features = jsonb_set(features, '{carType}', '"XPlus"')
--   WHERE features->>'carType' IN ('T+Plus Particular', 'TREAS-X');
-- UPDATE cars SET features = jsonb_set(features, '{carType}', '"ConfortPlus"')
--   WHERE features->>'carType' IN ('T+Plus Especial', 'TREAS-E');
--
-- -- Revisa el resultado antes de confirmar:
-- SELECT service_type, count(*) FROM cars GROUP BY 1 ORDER BY 2 DESC;
-- -- COMMIT;   -- o ROLLBACK; si algo no cuadra
