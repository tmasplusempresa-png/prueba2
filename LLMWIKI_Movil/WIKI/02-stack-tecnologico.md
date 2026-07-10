# Stack tecnológico

> Tecnologías por capa, separadas por plataforma. Backend es común salvo donde se indica.

---
tags: [stack, tecnologia]
entidades: [React Native, Expo, React, Vite, Supabase, Firebase, Mapbox, Agora]
---

## App móvil — `AplicaciónMovilTmasplus/App/`

| Capa | Tecnología |
|------|-----------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Routing | Expo Router 6 (file-based) + React Navigation (native-stack) |
| Lenguaje | TypeScript (`strict`) |
| Estado | Redux Toolkit + react-redux (store activo `common/store/index.ts`) |
| Mapas | `@rnmapbox/maps` + `react-native-maps` + Google Maps Directions |
| Llamadas | Agora UIKit (`@agora/uikit`) |
| Push | Expo Notifications + FCM |
| Pagos | Daviplata + billetera interna |
| Identidad/OCR | Topus + Google Cloud Vision |
| i18n | `i18next` / `react-i18next` / `i18n-js` |
| Observabilidad | Sentry (`@sentry/react-native`) |
| Build/OTA | EAS Build + Expo Updates |
| Testing | Jest + `@testing-library/react-native`; E2E Maestro |

Config: `app.config.js` (deriva de `.env`) → `config/AppConfig.ts` (lectura tipada vía `Constants.expoConfig.extra`).

## Dashboard web — `AplicacionWebTmasplus/TmasPlus_webSite/`

| Capa | Tecnología |
|------|-----------|
| Framework | React 19.1.1 |
| Bundler | Vite 7.1.7 |
| Lenguaje | TypeScript 5.9.3 (`strict`) |
| Estilos | Tailwind CSS 3.4.3 |
| Routing | React Router DOM 7.9.4 |
| Animaciones | Framer Motion 12.23.24 |
| Estado | React Context (no Redux) — `AuthContext` |
| Backend | Supabase JS SDK 2.39.0 |
| UI | Lucide React + React Icons + Sonner (toasts) |
| Validación | Zod |
| PDFs | `@react-pdf/renderer` |
| Mapas | Leaflet |
| Hosting | Vercel (`vercel.json`) |

Config: `.env.local` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POLLING_INTERVAL`.

## Backend compartido

Ver [[05-backend-supabase]]. Resumen:

- Supabase proyecto `utofhxgzkdhljrixperh`.
- Firebase proyecto `treasupdate` (legado, hospeda Cloud Functions Daviplata + FCM).

## Decisiones técnicas notables

- **Fetch REST + JWT directo** en móvil (en lugar del SDK Supabase) para varios
  servicios — evita lock de auth del SDK en RN. Helper `getSupabaseAuthHeaders`.
- **RPC `get_auth_profile`** en web — evita peleas con RLS al cargar perfil tras login.
- **Mini-sesiones** en web `AuthContext` para conductores no aprobados — ver `04-app-web-dashboard` (ver LLMWIKITmasPlus/ raíz del workspace, no existe en esta copia).
- **Servicios estáticos** en web (`UsersService.getDrivers()`) — sin instanciar.
- **Caveman** activado en codificación para reducir tokens — ver `SCHEMA_LOG/AGENTS.md`.

## Fuentes
- `AplicaciónMovilTmasplus/App/documentacion/ARQUITECTURA.md` §1
- `AplicacionWebTmasplus/TmasPlus_webSite/README.md` §🛠️
- `AplicacionWebTmasplus/TmasPlus_webSite/package.json`
- `AplicacionWebTmasplus/TmasPlus_webSite/docs/ARCHITECTURE.md`
