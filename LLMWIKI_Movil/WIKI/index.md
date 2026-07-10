# Índice — LLM Wiki AplicacionMovilTmasplus

> Knowledge base **reenfocado exclusivamente en la app móvil** (React Native
> + Expo, cliente↔conductor). Copia derivada de `LLMWIKITmasPlus` (raíz del
> workspace, cubría móvil + web dashboard) — acá se sacó todo lo que era
> puramente del dashboard web (`AplicacionWebTmasplus`). Si necesitás
> contexto del web o del módulo `Agente/`, consultá `LLMWIKITmasPlus/` en la
> raíz del workspace, no esta copia.
>
> Páginas de pricing (21-27) se mantienen tal cual porque documentan
> `FareCalculator` (motor real del móvil) y sus comparativas contra otros
> canales — el contraste es contexto útil para entender por qué el móvil
> calcula como calcula, no alcance web en sí.

## Mapa de páginas

- [[01-arquitectura-general]] — Visión 30k pies (leer con criterio: describe el workspace completo, no solo móvil).
- [[02-stack-tecnologico]] — Tecnologías por capa.
- [[03-app-movil]] — React Native + Expo (cliente / conductor). **Página central de esta copia.**
- [[05-backend-supabase]] — Supabase compartido: Auth, Postgres, RLS, Edge Funcs.
- [[06-flujos-negocio]] — Reserva, tracking, OTP, pago, llamadas, referidos.
- [[07-entidades-bd]] — Tablas clave del esquema.
- [[08-servicios-externos]] — Mapbox, Agora, Daviplata, Topus, Vision, FCM.
- [[09-cuentas-credenciales]] — Inventario de cuentas y dónde vive cada secreto.
- [[10-deuda-tecnica]] — Inconsistencias detectadas a resolver. ⚠️ Contiene items mixtos (móvil + web heredados de la copia original) — los que mencionan `AplicacionWebTmasplus` explícitamente no son responsabilidad de este proyecto, quedaron como referencia cruzada.

### Servicios de dominio (móvil)
- [[11-servicio-otp]] — Generación / validación OTP de viaje.
- [[12-servicio-booking-realtime]] — Suscripciones Realtime + CRUD bookings.
- [[13-servicio-driver-tracking]] — Posición conductor + ETA Haversine.
- [[14-servicio-memberships]] — Lectura doble vía REST/SDK.
- [[15-servicio-call]] — Llamadas Agora 1-a-1.

### Backend y datos
- [[16-rest-endpoints-rpc]] — Catálogo REST + RPC + Edge Functions + Triggers.
- [[17-esquema-bookings]] — Columnas reales, RLS, estados, triggers.
- [[18-esquema-users-rls]] — Perfiles + RLS de 7 políticas.
- [[19-esquema-memberships]] — Tabla membresía + auditoría.
- [[20-realtime-channels]] — Tres canales Realtime activos.

### Dominio de negocio — Pricing (motor real del móvil)
- [[21-calculo-tarifa]] — Algoritmo `FareCalculator` móvil paso a paso. **Fuente única de verdad para tarifas en este proyecto.**
- [[22-plan-fix-bug-min-fare]] — Plan de remediación bug "cliente paga < `min_fare`" (fixes de móvil ya cerrados, ver estado dentro).
- [[23-modelo-pricing-excel-oficial]] — Auditoría Excel `board`. Fuente canónica de negocio (no técnica de este proyecto, pero define las reglas que `FareCalculator` implementa).
- [[24-sistema-calculo-python]] — Implementación referencia Python (`tarifa_engine.py`, otro repo) — comparativa, no código de este proyecto.
- [[25-rpc-calcular-tarifa]] — RPC SQL en Supabase — aspiracional, el móvil todavía no la consume (usa `FareCalculator` local).
- [[26-comparativa-canales-pricing]] — Excel ↔ Python ↔ RPC ↔ Móvil ↔ backendRemoto. Útil para entender por qué el móvil puede divergir de otros canales para el mismo viaje.
- [[27-tarifa-backendremoto-agente]] — Implementación más evolucionada (otro repo, `Agente/`) — referencia de a dónde debería evolucionar `FareCalculator`.

## Qué se sacó de esta copia (vs `LLMWIKITmasPlus` original)

- `04-app-web-dashboard.md` — dashboard web, cero relevancia acá.
- `28-tarifa-web-dashboard.md` — bug/implementación específica de `AddBookingPage.tsx` (web), cero relevancia acá.

## Convenciones

- Páginas usan `[[wikilinks]]` por nombre de archivo (sin `.md`).
- Cada página termina en `## Fuentes` con rutas reales del repo.
- Entidades en `code` (`users`, `OtpService`).
- Cambios → registrar en [SCHEMA_LOG/log.md](../SCHEMA_LOG/log.md).
- Esta copia vive en `AplicacionMovilTmasplus/LLMWIKI_Movil/` — si el
  workspace original (`LLMWIKITmasPlus/` en la raíz) se actualiza, esta
  copia **no se sincroniza automáticamente**. Revisar manualmente cada
  tanto o dejar de mantenerla si diverge demasiado.
