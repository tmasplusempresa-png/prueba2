# Modelo oficial de pricing — Excel `Base para Agente T+Plus.xlsm`

> Auditoría 2026-05-05 del archivo Excel maestro. **Fuente canónica** de la
> política de tarifas. Resuelve la decisión arquitectónica pendiente en
> [[22-plan-fix-bug-min-fare]].

---
tags: [pricing, excel, dominio, canonico]
entidades: [board, Tabla Tarifas, Tapa, Asignación]
---

## Hojas y rol

| Hoja | Rol |
|------|-----|
| `Tapa` | UI del operador (entrada manual + display) |
| `board` | Motor de cálculo (fórmulas, sin VBA) |
| `Tabla Tarifas` | Catálogo precios por categoría |
| `Asignación` | Datos del conductor asignado |

**No hay lógica VBA en el cálculo.** Única macro: `Módulo2.GuardarServicioHorizontal` (solo copia a Consolidado).

## Política confirmada (resuelve decisión arquitectónica)

```
Tapa!F11 Valor Conductor = board!J25                  (subtotal cliente bruto post-ROUNDUP centena)
Tapa!F13               = F11 × 25% + F11              (= F11 × 1.25)
Tapa!F14 Valor Cliente = ROUNDUP(F13, -2)             (centena superior)
Tapa!H14 Ganancia Erixon = F14 - F11                  (margen 25%, queda en plataforma)
```

**Opción C confirmada:**
- `trip_cost` corresponde a `total_conductor` (precio que recibe conductor).
- Cliente paga `total_conductor × 1.25` redondeado centena superior.
- Margen 25% es **ganancia de plataforma (Erixon)**, NO comisión adicional al cliente.
- Comisiones empresariales (J27..J34) viven en **path empresarial separado** — no aplican a cliente final retail.

Esta política aplica también a [[24-sistema-calculo-python]] y [[25-rpc-calcular-tarifa]].

## Tabla Tarifas — valores canónicos

| Categoría | Base | Valor distancia | Valor hora | Min fare |
|-----------|------|-----------------|------------|----------|
| TaxiPlus | 4 920 | 540 | 25 560 | 8 880 |
| XPlus | 4 800 | 16.8 | 27 600 | 8 400 |
| ConfortPlus | 10 800 | 660 | 36 000 | 19 200 |
| VanPlus | 30 000 | 390 | 84 000 | 54 000 |

| Delta | Valor |
|-------|-------|
| Aeropuerto | 12 000 |
| Aeropuerto Programado | 4 800 |

**Intermunicipal = urbano / (1 - 50%) = urbano × 2.** No es precio independiente,
es proporción fija.

**`Rate_per_Hour` es engañoso:** por construcción `=valor_hora/60` almacena
**valor por minuto**. Confirma trampa documentada en [[10-deuda-tecnica]] §16.

## Algoritmo board (parte CONDUCTOR — columna F)

| Celda | Concepto | Fuente |
|-------|----------|--------|
| F17 | Tarifa básica | VLOOKUP `base_fare` o `base_fare_inter` |
| F18 | Precio × km | VLOOKUP `valor_distancia` o `_inter` |
| F19 | Precio × minuto | VLOOKUP `Rate_per_Hour` o `_inter` |
| F20 | Δ Aeropuerto | `IF(B8=1, 10000, 0)` **HARDCODE** |
| F21 | Δ Programado | `IF(B9=1, 4000, 0)` **HARDCODE** |
| F22 | Δ Protocolo | `IF(L7="Si", 5000, 0)` **HARDCODE** |
| F23 | Parqueadero | manual |
| F24 | Peajes | `F14+H14+J14+L14` (4 peajes) |
| F25 | Cobro mínimo | VLOOKUP `min_fare` |
| F28 | Seguro empresa | `IF(B7=1, 800, 0)` |
| F29 | Insurance | `500` constante literal |
| F30 | TPLUS | `=F28-F29` ⚠️ negativo si no empresa |

## Algoritmo board (parte CLIENTE — columna J)

| Celda | Fórmula | Notas |
|-------|---------|-------|
| J17 | `=F17` | base |
| J18 | `=F18*F10` | km × precio |
| J19 | `=IF(H4="Normal", F19*(F11/60), F19*60)` | **bug por hora >1h** |
| J20-J24 | `=F20…F24` | mirror columna F |
| **J25 Subtotal cliente** | `=ROUNDUP(SUM(J17:J24),-2)` | redondeo centena superior |
| J27 Dcto membresía | `=IF(F7="Si", J25*L10, 0)` | ⚠️ condicionado mal (Empresarial no Membresía); L10=0 |
| J29 Comisión empresa | `=IF(B7=1, J25*20% - J30, 0) + J32` | |
| J30 Procesamiento | `=IF(B7=1, J25*30%*8%, 0)` | 2.4% |
| J31 IVA proces. | `=J30*19%` | ⚠️ calculado pero no sumado |
| J32 PayU | `10000` constante | |
| J33 Seguro | `=F28` | |
| J34 Pago Conductor empresarial | `=ROUND(J25+SUM(J26:J33),-1) - J32` | |

## Hallazgos críticos auditoría

### 8.1 Lógica ausente
1. **Umbral 29 km Urbano↔Intermunicipal NO modelado.** Operador debe seleccionar manual. Recomendación: `D7 = IF(F10>29, "Intermunicipal", "Urbana")`.
2. **"Ida y Vuelta" no afecta cobro.** Selección puramente informativa.
3. **Modo "Por Hora" >1h subestima:** `F19*60` cobra siempre 60 min sin escalar.

### 8.2 Hardcodes vs Tabla Tarifas
| Concepto | board hardcode | Tabla Tarifas | Impacto |
|----------|----------------|---------------|---------|
| Δ Aeropuerto | **10 000** | **12 000** | **Subcobra 2 000** |
| Δ Aeropuerto Programado | (no usado) | 4 800 | Ignora combinación |
| Δ Programado | 4 000 | no parametrizado | OK funcional, mal por mantenimiento |
| Protocolo | 5 000 | no parametrizado | igual |
| Insurance | 500 | no parametrizado | igual |
| PayU | 10 000 | no parametrizado | igual |

### 8.3 Errores de lógica Excel
1. `J27` condicionado a Empresarial (F7), no Membresía (F4). L10=0 deja descuento siempre 0.
2. `F30 = F28 - F29` produce -500 si no empresarial. Falta `MAX(0, …)`.
3. `J31 IVA proces.` calculado pero NO sumado a `J34`.
4. `F11 Tiempo segundos` depende de `Tapa!F7=(C18-C17)×1440`. Si operador no llena hora fin, tiempo=0 silencioso.
5. F17 rango usa B1:C5 (incluye encabezados). Funciona por VLOOKUP exacto, inconsistente con demás celdas.
6. `Asignación!I2:I5` catálogo vehículos NO coincide con `Tabla Tarifas` (etiquetas distintas).

### 8.4 Riesgo crítico — Min_fare NO se aplica en Excel
**`F25` (Cobro Mínimo) se calcula pero NUNCA se compara contra `SUM(F17:F24)`.**
No existe `MAX(SUM(F17:F24), F25)` en ninguna celda. Operador humano debería
forzarlo manualmente.

→ **Esto explica el bug operacional reportado:** Excel no garantiza piso de
min_fare. La app móvil intenta aplicarlo en código pero el path BUG-1
(variable `estimate` no declarada — ver [[22-plan-fix-bug-min-fare]]) lo
evade, replicando el mismo defecto del Excel a producción digital.

### 8.5 Doble redondeo
`J25 = ROUNDUP(centena)` y luego `F14 = ROUNDUP(F11×1.25, centena)` aplica un
segundo ROUNDUP. Desviación hasta 199 COP por servicio.

### 8.6 Paths conductor↔cliente no reconciliados
Path conductor `F30` y path cliente `J34` son cálculos paralelos del pago al
conductor que NO se reconcilian. `Tapa!F11` toma `J25` (subtotal cliente bruto)
como base — no toma `J34` ni costos del conductor. "Ganancia Erixon" refleja
solo 25%, ignorando descuentos/comisiones J27..J33.

## Recomendaciones priorizadas

1. **Implementar piso mínimo:** `J25 = ROUNDUP(MAX(SUM(J17:J24), F25), -2)`.
2. **Automatizar Urbano/Intermunicipal:** `D7 = IF(F10>29, "Intermunicipal", "Urbana")`.
3. **Parametrizar todos los deltas** en Tabla Tarifas — eliminar hardcodes board.
4. **Corregir F19 modo Por Hora.**
5. **Modelar Ida y Vuelta:** `IF(C2="Ida y Vuelta", 2, 1)` aplicado a km y minutos.
6. **Corregir J27** para depender de F4 (Membresía), poblar L10 con % real.
7. **Acotar F30** con MAX(0, …).
8. **Decidir si J31 IVA debe sumarse a J34.**
9. **Unificar catálogo de categorías** entre Tabla Tarifas y Asignación!I2:I5.
10. **Revisar F11 como base conductor:** debería ser `J34` no `J25`.

## Discrepancias con app móvil

| | Excel oficial | App móvil (`FareCalculator.tsx`) |
|--|---------------|----------------------------------|
| Δ Aeropuerto | 10 000 hardcode board (Tabla dice 12 000) | Lee `delta_aeropuerto` de BD (12 000) |
| Aplica min_fare | ❌ no | ✅ sí (sobre rawTotal) |
| Margen 25% base | `J25` (subtotal cliente bruto post-roundup) | `rawTotal` (pre-roundup, pre-min check) |
| Doble redondeo | sí (J25 + F14) | parcialmente (clientTotal evita por usar rawTotal) |
| Ida y Vuelta | sin efecto | `mult = tripType === "Ida y Vuelta" ? 2 : 1` en `getVehiclePrice` |

## Fuentes
- `C:/test/TmasPlus/Auditoria_Modelo_Tarifas_TPlus.md` (auditoría completa 265 líneas)
- `Base para Agente T+Plus.xlsm` (no ingerido como binario, datos vía auditoría)
- [[21-calculo-tarifa]] — algoritmo móvil
- [[22-plan-fix-bug-min-fare]] — plan de fix
- [[24-sistema-calculo-python]] — implementación referencia Python
- [[25-rpc-calcular-tarifa]] — RPC SQL backend
