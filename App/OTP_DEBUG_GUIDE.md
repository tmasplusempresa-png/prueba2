# 🔧 GUÍA DE DEBUG - OTP NO MUESTRA

## Problema
El OTP no se muestra visualmente ni se imprime en la consola

## Logs a Verificar en la Consola

Abre DevTools (F12) y sigue estos pasos para ver exactamente dónde se atora:

### Paso 1: Verifica que llegas al botón
Cuando hagas clic en "Solicitar Viaje", deberías ver ESTE log:
```
🔵 [UI] Botón 'Solicitar Viaje' presionado
   - isButtonDisabled: false
   - selectedVehicle: {nombre-del-vehiculo}
```

**Si NO ves este log:**
- ❌ El botón no está siendo presionado
- ❌ Verifica que hayas seleccionado un vehículo (selectedVehicle debe tener valor)
- ❌ El botón podría estar deshabilitado (isButtonDisabled en true)

---

### Paso 2: Verifica validaciones iniciales
Después del log anterior, deberías ver:
```
📱 [BookingScreen] Click en 'Solicitar Viaje'
✅ [BookingScreen] User: user-id-xxx
✅ [BookingScreen] Vehicle: TREAS-X (o el nombre del vehículo)
✅ [BookingScreen] Origin: Cra 2b #127B-71 (o tu origen)
✅ [BookingScreen] Destination: Calle 170 (o tu destino)
✅ [BookingScreen] Payment Type: cash
```

**Si ves ESTO:**
```
❌ [BookingScreen] Faltan campos requeridos
```

Significa que una o más de estas variables no están configuradas:
- `selectedVehicle` = NULL/UNDEFINED
- `origin` = NULL/UNDEFINED
- `destination` = NULL/UNDEFINED
- `selectedPaymentType` = NULL/UNDEFINED

---

### Paso 3: Verifica la generación del OTP
Si pasaste la validación, deberías ver:
```
✅ [BookingScreen] Todos los campos validados - Procediendo a generar OTP
🔐 [BookingScreen] Generando OTP...
✅ [OTP Service] Código generado: 4821
✅ [BookingScreen] OTP generado: 4821
✅ [BookingScreen] State OTP actualizado: 4821
✅ [BookingScreen] Abriendo modal OTP...
✅ [BookingScreen] Modal OTP debería estar visible ahora
```

**Si solo ves** `❌ [BookingScreen] No hay usuario`
- El usuario (Redux store) no está siendo recuperado correctamente

---

### Paso 4: Verifica el Modal OTP
Si todo llegó hasta aquí, el modal debería aparecer. En la consola verás:
```
🔐 [OTP MODAL] 📱 Código de verificación: 4821
```

---

## Posibles Causas y Soluciones

### ❌ Problema 1: Botón deshabilitado
**Síntoma:** `isButtonDisabled: true` en el primer log
**Solución:** 
- Espera a que desaparezca el "Procesando..."
- O recarga la pantalla

### ❌ Problema 2: No hay vehículo seleccionado
**Síntoma:** `selectedVehicle: undefined` o `selectedVehicle: null`
**Solución:**
- Ve a la sección de vehículos
- Selecciona uno (tap en la tarjeta del vehículo)
- Espera a que se actualice
- Luego intenta de nuevo

### ❌ Problema 3: No hay origen o destino
**Síntoma:** `Origin: null` o `Origin: undefined`
**Solución:**
- Completa el campo de Origen (busca o selecciona una ubicación)
- Completa el campo de Destino
- Verifica que aparezcan en el mapa

### ❌ Problema 4: Usuario no está autenticado
**Síntoma:** `User: undefined` o `❌ [BookingScreen] No hay usuario`
**Solución:**
- Ingresa/login en la app
- Completa tu perfil
- Vuelve a BookingScreen

### ❌ Problema 5: Redux no está actualizando
**Síntoma:** Ver logs pero el modal no aparece visualmente
**Solución:**
- Recarga la app (Ctrl + R o shake en dispositivo)
- Limpia el cache de Redux
- Vuelve a intentar

---

## Checklist Antes de Intentar

- [ ] ¿Iniciaste sesión?
- [ ] ¿Tienes un vehículo seleccionado? (debería estar resaltado)
- [ ] ¿Pusiste Origin (lugar de salida)?
- [ ] ¿Pusiste Destination (lugar de llegada)?
- [ ] ¿Seleccionaste método de pago? (Efectivo/Nequi/Daviplata)
- [ ] ¿El botón "Solicitar Viaje" está activo (no gris)?

---

## Pasos de Depuración Automáticos

Copia y pega esto en la consola de DevTools para ver el estado actual:

```javascript
console.table({
  "User": typeof window.mockUser,
  "Vehicle": "Revisa si selectedVehicle tiene valor",
  "Origin": "Revisa si origin tiene título",
  "Payment": "Debería ser: cash, nequi, o daviplata"
})
```

---

## Contacto / Próximos Pasos

Si después de este debug aún no funciona:

1. **Captura una screenshot** de los logs en consola
2. **Abre DevTools → Console** y copia TODO lo que veas
3. **Reporta qué logs SÍ ves** y cuáles NO

---

## URLs de Referencia

- **OtpModal**: `components/OtpModal.tsx` (línea ~20-50)
- **OtpService**: `common/services/OtpService.ts` (línea ~6-15)
- **BookingScreen**: `app/(tabs)/BookingScreen.tsx` (línea ~620-680)

---

## Ejemplo Correcto de Flujo

Si TODO funciona, tu consola debe verse EXACTAMENTE así:

```
🔵 [UI] Botón 'Solicitar Viaje' presionado
   - isButtonDisabled: false
   - selectedVehicle: TREAS-X Plus

📱 [BookingScreen] Click en 'Solicitar Viaje'
✅ [BookingScreen] User: user_abc123
✅ [BookingScreen] Vehicle: TREAS-X Plus
✅ [BookingScreen] Origin: Cra 2b #127B-71, Bogotá
✅ [BookingScreen] Destination: Avenida Calle 100, Bogotá
✅ [BookingScreen] Payment Type: nequi
✅ [BookingScreen] Todos los campos validados - Procediendo a generar OTP
🔐 [BookingScreen] Generando OTP...
✅ [OTP Service] Código generado: 7249
✅ [BookingScreen] OTP generado: 7249
✅ [BookingScreen] State OTP actualizado: 7249
✅ [BookingScreen] Abriendo modal OTP...
✅ [BookingScreen] Modal OTP debería estar visible ahora
🔐 [OTP MODAL] 📱 Código de verificación: 7249
```

Cuando veas este flujo completo, el modal OTP debería estar visible.

---

**Última actualización:** Marzo 31, 2026
**Versión:** v2 (Con Debug Extendido)
