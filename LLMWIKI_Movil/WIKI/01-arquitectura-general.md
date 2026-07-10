# Arquitectura general TmasPlus

> Plataforma de movilidad tipo ride-hailing en Colombia. Una app móvil binaria
> dual-rol (cliente / conductor) + un dashboard web (admin + onboarding de
> conductores), conectados al mismo backend Supabase.

---
tags: [arquitectura, vista-general]
entidades: [App, Dashboard, Supabase, Firebase]
---

## Componentes

| Componente | Tecnología | Audiencia | Repo |
|------------|-----------|-----------|------|
| App móvil | React Native 0.81 + Expo SDK 54 | Cliente final y conductor | `AplicaciónMovilTmasplus/App/` |
| Dashboard web | React 19 + Vite 7 + TS 5.9 | Administradores T+Plus + drivers en registro | `AplicacionWebTmasplus/TmasPlus_webSite/` |
| Backend principal | **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions) | Compartido | proyecto `utofhxgzkdhljrixperh` |
| Backend secundario | **Firebase** (proyecto `treasupdate`) | Cloud Functions de Daviplata + FCM legado | externo |

Detalle por capa: [[02-stack-tecnologico]].

## Identidad de los binarios

- App móvil: `com.tmasplus.tmasplus` (Android) / `tmasplus.tmasplus` (iOS).
  Hay fallback `com.releaseunocero` en `app.config.js` — ver [[10-deuda-tecnica]].
- Web: dashboard SPA servido desde Vercel (`vercel.json`).

## Reparto de responsabilidades

| Capacidad | Dónde vive | Notas |
|-----------|-----------|-------|
| Solicitar viaje (cliente) | App móvil | Único punto de entrada |
| Aceptar viaje (conductor) | App móvil | **Exclusivo** — la web NO lo hace, ver `README.md` web |
| Tracking en tiempo real | App móvil (publish + subscribe) | Realtime Supabase + background task |
| OTP de inicio de viaje | App móvil | `OtpService` — ver [[06-flujos-negocio]] §OTP |
| Pago Daviplata | App móvil | Pasarela colombiana, Cloud Functions Firebase |
| Registro de conductor (multi-step) | Web `/register-driver` | Mini-sesión + recuperación de progreso |
| Aprobación de conductor | Web (admin) | `approved: true` |
| Gestión de vehículos | Ambos (CRUD admin web; lectura móvil) | Validación de placa única |
| Reservas corporativas | Web `AddBooking` | Solo admin |
| Llamadas voz/video | App móvil | Agora |
| Membresías y referidos | App móvil + dashboard | Mismas tablas en Supabase |

## Roles de usuario (tabla `users.user_type`)

- `client` — cliente final, app móvil.
- `driver` — conductor. Hasta aprobarse, accede a web `/register-driver`; tras
  aprobación pierde acceso web y opera solo desde móvil.
- `admin` — único rol con acceso al dashboard web (`approved: true`, `blocked: false`).

## Diagrama lógico

```
┌────────────────┐         ┌────────────────┐
│  App Móvil     │         │  Dashboard Web │
│ (cliente/      │         │ (admin +       │
│  conductor)    │         │  driver onboarding)
└────┬───────────┘         └────────┬───────┘
     │                              │
     │       Supabase (utofhxgzkdhljrixperh)
     │   Auth · Postgres · Storage · Realtime · Edge
     ├──────────────┬──────────────┤
     │              │              │
     ▼              ▼              ▼
  Mapbox         Agora        Firebase (treasupdate)
  GMaps         (voz/video)   Cloud Functions Daviplata
  Topus                       FCM legado
  Vision OCR
```

## Fuentes
- `AplicaciónMovilTmasplus/App/documentacion/ARQUITECTURA.md` §1–§4
- `AplicacionWebTmasplus/TmasPlus_webSite/README.md` líneas 252–318
- `AplicacionWebTmasplus/TmasPlus_webSite/docs/ARCHITECTURE.md`
