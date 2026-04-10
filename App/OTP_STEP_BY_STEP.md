# 🎯 INSTRUCCIONES PARA DEPURACIÓN DEL OTP

## Estado Actual del Bug
El OTP no se muestra ni en consola ni en interfaz después de hacer clic en "Solicitar Viaje"

---

## PASO 1: Verifica los Logs Iniciales

Haz esto ahora mismo:
1. Abre la app en el emulador o dispositivo
2. Abre DevTools (F12 en web, o DevTools en el emulador)
3. Vé a la pestaña **Console**
4. Busca el primer log:

```
════════════════════════════════════════════════════════
🚀 [BookingScreen MOUNTED] Componente ha cargado
════════════════════════════════════════════════════════
```

**¿Lo ves?**
- ✅ SÍ → Continúa con PASO 2
- ❌ NO → La app no está cargando correctamente. Reinicia la app.

---

## PASO 2: Completa el Formulario

Ahora debes completar todos estos campos en la pantalla de BookingScreen:

1. **Origen (Origin)**
   - Haz clic en el campo "Cra 2b #127B-71..."
   - Selecciona cualquier ubicación (ej: Tu casa, un lugar cercano)
   - Espera a que se actualice

2. **Destino (Destination)**
   - Haz clic en el campo "Avenida Calle 100..."
   - Selecciona una ubicación diferente
   - Espera a que se actualice el mapa

3. **Vehículo (Vehicle)**
   - Desplázate hacia abajo en la sección de Bottom Sheet
   - Toca una tarjeta de vehículo (ej: TREAS-X, TREAS-X Plus)
   - Debería estar resaltada en CYAN

4. **Tipo de Pago (Payment Type)**
   - Si no está completo, haz clic en iconos de pago
   - Selecciona: Efectivo, Nequi o Daviplata
   - IMPORTANTE: Debe estar seleccionado

5. **Verifica que el botón "Solicitar Viaje" NO esté gris**

---

## PASO 3: Haz Click en "Solicitar Viaje"

1. Ahora haz clic en el botón **"Solicitar Viaje"** (en amarillo/cyan)
2. **Mira inmediatamente la consola** (F12)
3. Deberías ver ESTE log exactamente:

```
🔵 [UI] Botón 'Solicitar Viaje' presionado
   - isButtonDisabled: false
   - selectedVehicle: TREAS-X (o similar)
```

---

## PASO 4: Analiza los Logs

### Caso A: Ves el log del botón presionado

Sigue leyendo los logs. Deberías ver:

```
📱 [BookingScreen] Click en 'Solicitar Viaje'
✅ [BookingScreen] User: abc123xyz...
✅ [BookingScreen] Vehicle: TREAS-X Plus
✅ [BookingScreen] Origin: Tu Origen
✅ [BookingScreen] Destination: Tu Destino
✅ [BookingScreen] Payment Type: nequi
```

**¿Ves todos estos?**

- ✅ SÍ → Continúa leyendo los próximos logs
- ❌ NO (ves un "❌ [BookingScreen] Faltan campos requeridos") → 
  - Ve a **PASO 2** nuevamente
  - Verifica que hayas completado TODOS los campos
  - Algunos campos podrían estar NULL

---

### Caso B: NO ves el log del botón presionado

**Posibles causas:**

1. **¿Hiciste clic realmente en el botón?**
   - Toca el botón "Solicitar Viaje" de nuevo CON FUERZA
   - Espera 1 segundo
   - Mira la consola

2. **¿El botón está gris (deshabilitado)?**
   - Si está gris, es porque:
     - NO tiene vehículo seleccionado
     - O `isButtonDisabled` está en true
   - Selecciona un vehículo primero

3. **¿Estás en BookingScreen realmente?**
   - Verifica que veas:
     - Mapa arriba
     - Campos de Origen/Destino
     - Vehículos disponibles
   - Si NO, navega a BookingScreen

---

## PASO 5: Si Ves "Todos los campos validados..."

Cuando veas:
```
✅ [BookingScreen] Todos los campos validados - Procediendo a generar OTP
🔐 [BookingScreen] Generando OTP...
✅ [OTP Service] Código generado: XXXX
```

Entonces **¡PERFECTO!** 

En este punto deberías ver un MODAL grande en la pantalla que muestra el código grande en CYAN.

**¿Lo ves?**
- ✅ SÍ → ¡FUNCIONA! Ingresa el código en el campo y confirma
- ❌ NO → El Modal se generó pero no se renderizó 
  - Verifica que veas el log: `🔐 [OTP MODAL] 📱 Código de verificación: XXXX`
  - Si NO ves esto, hay un problema con el Modal

---

## PASO 6: Validación del OTP

Una vez que veas el modal:

1. **COPIA el código** que ves en grande (ej: 4821)
2. **Toca el campo de entrada** de abajo
3. **Pega/ingresa el código** de 4 dígitos
4. **Toca "Confirmar"**

Deberías ver en consola:
```
✅ [OTP Validation] OTP correcto - Proceediendo con el booking
```

Y el modal debería cerrarse.

---

## TABLA DE REFERENCIA RÁPIDA

| Log | Significado | Acción |
|-----|-------------|--------|
| 🚀 [BookingScreen MOUNTED] | App cargó correctamente | Continúa |
| 🔵 [UI] Botón presionado | Click registrado | Espera siguiente log |
| ❌ [BookingScreen] Faltan campos | No completaste formulario | Ve a PASO 2 |
| ✅ [BookingScreen] Todos validados | Todo bien, generando OTP | Mira consola |
| ✅ [OTP Service] Código generado: XXXX | OTP creado | Mira consola |
| 🔐 [OTP MODAL] Código verificación: XXXX | Modal listo | Debería aparecer en pantalla |

---

## REPORTE FINAL

Cuando termines, reporta EXACTAMENTE esto:

1. **¿Ves el log inicial?** (🚀 [BookingScreen MOUNTED])
2. **¿Ves el log del botón?** (🔵 [UI] Botón presionado)
3. **¿Ves el log del OTP generado?** (✅ [OTP Service])
4. **¿Aparece el modal visualmente?**
5. **¿Se generó un código?** ¿Cuál? (ej: 4821)

---

## Links Importantes

**Archivos Clave:**
- Botón: `BookingScreen.tsx` línea ~1060
- OTP Modal: `components/OtpModal.tsx`
- OTP Service: `common/services/OtpService.ts`
- Debug Guide: `OTP_DEBUG_GUIDE.md`

---

**Versión:** v3 (Con Pasos Claros)
**Fecha:** Marzo 31, 2026
