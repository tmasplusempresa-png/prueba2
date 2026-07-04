ALTER TABLE public.car_types
ADD COLUMN IF NOT EXISTS umbral_intermunicipal_km numeric(10, 2) NOT NULL DEFAULT 29;
