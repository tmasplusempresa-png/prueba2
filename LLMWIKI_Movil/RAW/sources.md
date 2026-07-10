# RAW — Fuentes de verdad (AplicacionMovilTmasplus)

> Esta carpeta NO duplica código. Apunta a las rutas reales del repo. Cuando el
> agente necesite la verdad de referencia, lee desde aquí. Rutas relativas a
> `AplicacionMovilTmasplus/` salvo que se indique lo contrario.

## Aplicación Móvil

### Documentación curada
- `App/documentacion/ARQUITECTURA.md` — fuente principal (verificar vigencia antes de citar — no auditada línea por línea esta sesión)
- `App/documentacion/FRONTEND.md`
- `App/documentacion/ENDPOINTS_Y_CONSULTAS.md`
- `App/documentacion/POSTMAN_REST_API.md`
- `App/documentacion/README.md`

### Código fuente
- `App/app/` — Pantallas (Expo Router; **cualquier archivo acá es una ruta**, cuidado al dejar archivos sueltos como `index_XXXXX.tsx` — rompe el bundling, ver [[10-deuda-tecnica]])
- `App/components/` — componentes UI
- `App/hooks/` — hooks (ver [[03-app-movil]] para inventario)
- `App/common/services/` — servicios de dominio
- `App/common/store/` — Redux store (activo: `index.ts`)
- `App/common/reducers/`, `App/common/actions/`
- `App/config/` — Supabase, Mapbox, Firebase, Agora
- `App/supabase/BBDDRemota.sql` — **dump real del esquema de BD**, única fuente de verdad para columnas/constraints. ⚠️ `App/sql/` (carpeta con 53 scripts) **no existe en el repo** — cualquier referencia previa a ella en esta wiki es fuente fantasma, ver [[10-deuda-tecnica]] #30.
- `App/supabase/functions/` — Edge Functions (`generateAgoraToken`, `notifyIncomingCall`, `sync-driver-to-primary`)

### Guías históricas de features (App raíz)
OTP, notificaciones, Agora, mapa drag-drop, tracking en tiempo real,
inmediato vs programado, billetera/membresía. Ver `App/*.md` (~60 archivos,
no auditados individualmente).

## Dominio Pricing (motor real: `FareCalculator` en este proyecto)

### Raíz del workspace (fuera de este proyecto, contexto de negocio)
- `Auditoria_Modelo_Tarifas_TPlus.md` — auditoría completa del Excel `Base para Agente T+Plus.xlsm`. Fuente canónica de la política de negocio que `FareCalculator` implementa.
- `sistema_calculo/` — microservicio Python de referencia (otro proyecto del workspace, no este). Útil solo como comparativa.

### Agente backendRemoto (otro proyecto, excepción dirigida por relevancia a pricing)
- `Agente/backendRemoto/src/domains/booking/tarifa/engine.py` — algoritmo más evolucionado que `FareCalculator`; referencia de a dónde debería evolucionar el motor móvil.
- `Agente/llm-wiki/00-RAW/tablasDeWhatsapp.md` (esquema `VehicleCategory` BD remota agente)

> Nota: `Agente/` sigue **excluido para ingesta general** desde esta wiki.
> Solo se referencia `tarifa/engine.py` por relevancia directa al dominio
> pricing del móvil. No ingestar otros dominios del agente acá.

## Excluido (importante)

- `Agente/` → **NO ingestar** desde esta wiki. Tiene su propia base de conocimiento.
- `AplicacionWebTmasplus/` → fuera de alcance de esta copia. Consultar `LLMWIKITmasPlus/` (raíz del workspace) para contexto del dashboard web.
- `.env`, `GoogleService-Info.plist`, claves reales, tokens (Mapbox, GitHub, Supabase service_role) → **nunca** copiar a la wiki.
