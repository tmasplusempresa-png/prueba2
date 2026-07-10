# AGENTS.md — Reglas de gobierno de LLMWIKI_Movil (AplicacionMovilTmasplus)

> Instrucciones para cualquier agente (Claude Code, Codex, etc.) que
> mantenga esta wiki. Leer **antes** de cualquier operación de Ingest /
> Query / Lint. Esta es una **copia reenfocada** de `LLMWIKITmasPlus/`
> (raíz del workspace) — ver `WIKI/index.md` para el detalle de qué se
> sacó y por qué.

## Ámbito

Esta wiki cubre **únicamente** este proyecto:

- `AplicacionMovilTmasplus/` (App React Native + Expo, cliente + conductor)

**NO tocar `Agente/` ni `AplicacionWebTmasplus/` desde acá.** Cada uno tiene
(o debería tener) su propia base de conocimiento independiente —
`AplicacionWebTmasplus/` hoy vive documentado en `LLMWIKITmasPlus/` (raíz
del workspace), no en esta copia.

## Estructura

```
AplicacionMovilTmasplus/LLMWIKI_Movil/
├── RAW/              # Punteros a fuentes (NO duplicar código fuente; solo referencias)
├── WIKI/             # Conocimiento compilado en Markdown con wikilinks
└── SCHEMA_LOG/
    ├── AGENTS.md     # Este archivo
    └── log.md        # Bitácora de ingestas / cambios (heredada de la wiki original hasta 2026-07-04; después, historial propio de esta copia)
```

## Relación con `LLMWIKITmasPlus/` (raíz del workspace)

- Esta copia se creó el 2026-07-04 a partir del estado de `LLMWIKITmasPlus/`
  en ese momento. **No hay sincronización automática** — si la wiki
  original se actualiza después, esta copia queda desactualizada hasta que
  alguien la reconcilie a mano.
- Si un cambio de código en `AplicacionMovilTmasplus/` amerita actualizar
  documentación, actualizar **acá primero** (es el ámbito correcto); replicar
  a `LLMWIKITmasPlus/` solo si el cambio también es relevante para el
  contexto del web dashboard o la visión general del workspace.
- `10-deuda-tecnica.md` en esta copia todavía tiene ítems mixtos heredados
  (algunos mencionan explícitamente `AplicacionWebTmasplus`) — esos no son
  responsabilidad de esta wiki, quedaron como referencia cruzada. No
  agregar ítems nuevos que sean puramente del web acá; van en la wiki raíz.

## Formato de nota WIKI

Cada página `WIKI/*.md` debe:

1. Empezar con título `# Título`.
2. Tener una línea de **resumen** justo debajo (`> Resumen…`).
3. Incluir bloque de frontmatter mínimo:
   ```
   ---
   tags: [movil, backend, flujo, entidad, externo]
   entidades: [...]
   ---
   ```
4. Usar `[[wikilinks]]` para conectar conceptos (otras páginas WIKI por nombre de archivo sin `.md`).
5. Cerrar con sección `## Fuentes` apuntando a rutas reales del repo
   (`App/...` relativo a `AplicacionMovilTmasplus/`).

## Taxonomía

- **Entidad** = una cosa concreta y nombrable: tabla BD (`users`, `bookings`),
  servicio (`OtpService`), pantalla (`CustomerMap`), cuenta externa (`Supabase`,
  `Daviplata`, `Agora`, `Mapbox`).
- **Tema** = concepto transversal: "tracking en tiempo real", "autenticación",
  "pagos", "OTP", "cálculo de tarifa".
- **Flujo** = secuencia de pasos cliente↔conductor↔backend.

## Operaciones

### Ingest
- Leer fuentes en `RAW/sources.md` y los `.md` apuntados.
- Extraer entidades, flujos, decisiones técnicas — **solo del código de
  `AplicacionMovilTmasplus/App/`** (o backend compartido que ese código
  consume: Supabase, Mapbox, etc.).
- Crear/actualizar páginas WIKI. **No duplicar**: si la entidad ya existe,
  actualizar; si contradice, anotarlo en `## Conflictos detectados`.
- **Verificar contra código real antes de escribir** — esta sesión (2026-07-04)
  encontró múltiples páginas con fuentes fantasma (`App/sql/*.sql`, carpeta
  que nunca existió) y columnas de BD inventadas. No repetir ese patrón:
  toda afirmación de esquema/columna debe verificarse contra
  `App/supabase/BBDDRemota.sql` (dump real) o consulta directa a Supabase,
  no asumirse.

### Query
- Responder leyendo directamente las páginas WIKI (no embeddings).
- Si la respuesta requiere código real, ir al archivo apuntado en `## Fuentes`.

### Lint
- Detectar wikilinks rotos (apuntan a páginas inexistentes).
- Detectar páginas huérfanas (sin enlaces entrantes).
- Detectar info desactualizada (commit hash o ruta cambió en el repo).
- Detectar referencias a `App/sql/*` — esa carpeta no existe, cualquier
  mención es sospechosa de no estar verificada (ver [[10-deuda-tecnica]] #30
  en la wiki original).

## Codificación (Skill Caveman)

Cuando este proyecto involucre codificación, el agente debe usar la skill
`caveman` en nivel `full` para respuestas en chat. **Las páginas WIKI se
escriben en lenguaje normal**, no en caveman — la wiki es para humanos y
para futuros agentes que necesitan contexto completo.

## Reglas duras

- ❌ No tocar `Agente/` ni `AplicacionWebTmasplus/` desde esta wiki.
- ❌ No commitear secretos a la wiki (claves de Supabase, tokens Mapbox/Topus, etc.).
- ❌ No duplicar código fuente; solo enlazar.
- ❌ No citar archivos/columnas de BD sin verificar contra el código o el
  dump real (`App/supabase/BBDDRemota.sql`).
- ✅ Cada cambio significativo se registra en `SCHEMA_LOG/log.md`.
