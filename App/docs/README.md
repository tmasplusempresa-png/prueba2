# Documentación de TmasPlus

Bienvenido a la documentación de **TmasPlus**, la app de transporte urbano inteligente
(cliente ↔ conductor) construida con React Native + Expo + Supabase.

## Índice

| Documento | Descripción |
|-----------|-------------|
| 🏛️ [**ARQUITECTURA.md**](./ARQUITECTURA.md) | **Empieza aquí.** Visión general: stack, roles, estructura, estado, servicios, flujos, cuentas y correo. |
| 🖥️ [**FRONTEND.md**](./FRONTEND.md) | Guía del frontend: arranque, mapa de rutas (pantalla → archivo), componentes, hooks y **onboarding ("por dónde empezar" para meter código).** |
| 🔌 [**ENDPOINTS_Y_CONSULTAS.md**](./ENDPOINTS_Y_CONSULTAS.md) | Capas de datos, endpoints (REST/Edge/RPC), tablas y **las consultas más útiles para ejecutar en Supabase.** |
| 📚 [**API (TypeDoc)**](./api/README.md) | Referencia de código **auto-generada** de `common/`, `hooks/`, `config/` y `constants/`. |
| 📮 [**POSTMAN_REST_API.md**](./POSTMAN_REST_API.md) | Colección Postman con el detalle (body/respuesta) de los endpoints REST. |

## Cómo regenerar la referencia de API

La documentación de código se genera con **TypeDoc** (+ `typedoc-plugin-markdown`).
La configuración está en [`typedoc.json`](../typedoc.json).

```bash
npm run docs         # genera docs/api/
npm run docs:watch   # regenera en caliente al editar el código
```

> Consejo: añadir comentarios **JSDoc/TSDoc** sobre funciones, tipos y servicios
> exportados mejora directamente la calidad de `docs/api/`. Muchos servicios en
> `common/services/` ya están documentados así.
