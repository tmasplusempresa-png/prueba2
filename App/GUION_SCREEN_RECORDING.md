# Guion del screen recording para App Review — TmasPlus iOS

Apple pide un video **grabado en iPhone físico**, con **iOS actual**, que **empiece con el lanzamiento de la app** y recorra el flujo típico de usuario. Este es el orden exacto a grabar.

> El video lo produces tú y se lo entregas a Apple. El revisor no graba nada ni entra por TestFlight: abre la build que subes en el envío, con las credenciales demo del Notes. TestFlight es el canal para que la app llegue a tu iPhone y a los de tu equipo.

## Cómo se cubren los dos roles

Un viaje no existe sin cliente y conductor conectados a la vez, pero **todo lo que salga en cámara tiene que ser el iPhone**: el binario de iOS trae los dos roles (se separan por `usertype` de la cuenta), y Apple entra con ambas credenciales. Si el lado conductor nunca se ve en iOS, queda sin demostrar el permiso de ubicación en segundo plano, que es lo que más miran.

**Con dos iPhones (preferido):** graban los dos a la vez, un rol en cada uno, y montas las dos grabaciones una detrás de otra.

**Con un solo iPhone:** dos pasadas, usando el Android de Play Store como contraparte **fuera de cámara**.
- *Pasada 1* — el iPhone es el cliente (Bloques 1 a 5). El Android, sin grabar, tiene la sesión de conductor y va aceptando y ejecutando el viaje.
- *Pasada 2* — el iPhone es el conductor (Bloque 6). El Android, sin grabar, hace de cliente pidiendo el viaje.

En ambos casos el video final es 100% metraje de iPhone. La contraparte es otro usuario del servicio y no tiene por qué aparecer.

> Riesgo si usas el Android de Play Store: esa build es más vieja que la de iOS. **Haz un viaje completo de prueba iPhone↔Android antes de grabar en limpio.** Si la interacción falla, instala en el Android una build de desarrollo actual.

## Antes de grabar

- [ ] Instalar en el iPhone la build **nueva** de TestFlight (purpose strings corregidas y sin ATT). No grabar sobre debug ni sobre la build rechazada.
- [ ] **Verificar en el dispositivo que el texto del permiso de ubicación es el nuevo y largo.** Si sale el corto con `...`, la build no traía las correcciones y hay que recompilar antes de grabar.
- [ ] **Desinstalar y reinstalar** la app antes de grabar. Es la única forma de que los diálogos de permisos vuelvan a salir — Apple pidió verlos explícitamente y solo aparecen la primera vez.
- [ ] Preparar una **cuenta desechable** para la parte de borrado de cuenta. No uses la cuenta demo que le entregas a Apple: el borrado la deja inservible y el revisor no podría entrar.
- [ ] Confirmar que la cuenta conductor está **aprobada**, con documentos y vehículo validados.
- [ ] Silenciar llamadas y activar No Molestar en el teléfono que graba.
- [ ] Grabar con el Control Center de iOS. Con micrófono si vas a narrar; narrar en inglés ayuda.

---

## Bloque 1 — Lanzamiento (obligatorio que sea el inicio del video)

1. Home screen de iOS con el ícono de TmasPlus visible.
2. Tocar el ícono → splash → pantalla de login.

## Bloque 2 — Registro de cuenta

3. Tocar "Registrarse" y crear una cuenta nueva desde cero con la cuenta desechable.
4. Mostrar las validaciones del formulario en pantalla.
5. Mostrar la pantalla de verificación de correo y, si es viable, el correo llegando y la confirmación.

## Bloque 3 — Login y permisos

6. Iniciar sesión con la **cuenta demo cliente**.
7. Dejar que salgan y aceptar en cámara los diálogos de:
   - Ubicación *When In Use*
   - Notificaciones
   - Cámara / Fotos (se disparan al poner foto de perfil — si no salen solos, ir a Perfil y cambiar la foto)

   Estos diálogos deben verse legibles. Es el punto que Apple pidió de forma explícita.

## Bloque 4 — Flujo core del cliente

8. Mapa de inicio: fijar punto de recogida.
9. Buscar y fijar destino (mostrar el autocompletado de direcciones).
10. Ver categorías de vehículo con la **tarifa calculada antes de reservar**.
11. Solicitar un **viaje inmediato**.
12. (Contraparte) el conductor acepta.
13. Volver al cliente: seguimiento del vehículo en vivo, datos del conductor, ETA.
14. Mostrar **chat** con el conductor (escribir y enviar un mensaje).
15. Mostrar el **botón de llamada** (basta con que se vea el marcador nativo de iOS; puedes cancelar).
16. Mostrar **compartir viaje con contacto de seguridad**.
17. Mostrar el **OTP** de abordaje y su validación por parte del conductor.
18. Fin del viaje → pantalla de pago → **calificación del conductor** con estrellas y comentario.

## Bloque 5 — Reserva programada

19. Crear una **reserva programada** eligiendo fecha y hora futuras.
20. Mostrarla en el listado de reservas del cliente.

## Bloque 6 — Flujo core del conductor

21. Login con la **cuenta demo conductor**.
22. Permisos: ubicación **Always** y notificaciones (mostrar los diálogos).
23. Activar disponibilidad / ponerse en línea.
24. Recibir la solicitud de servicio (que se vea la notificación y se oiga la alerta).
25. Aceptar → navegar a recogida → confirmar llegada → validar OTP → iniciar viaje → finalizar → registrar el cobro.
26. Mostrar la pantalla de ganancias.

## Bloque 7 — Contenido de usuario y reportes

27. Mostrar el chat y la calificación ya grabados, y además el flujo de **queja/reporte** (`ComplainScreen`).
28. Narrar o rotular que el chat es 1 a 1 entre cliente y conductor de un mismo viaje, no es contenido público, y que las quejas las revisa el equipo de operaciones, que puede bloquear usuarios desde el backoffice.

## Bloque 8 — Membresía del conductor

29. Con la sesión de conductor, entrar a la billetera → membresías / paquetes de kilómetros.
30. Mostrar el detalle del plan y el flujo de pago con Daviplata **hasta donde sea coherente** con lo declarado en el punto 5 del Notes.
31. Dejar claro (rótulo o narración) que esto lo paga el **conductor** como cuota de afiliación para operar, y que **no desbloquea nada digital dentro de la app**.

## Bloque 9 — Borrado de cuenta

32. Con la **cuenta desechable** (no la demo), ir a Perfil → **Eliminar cuenta**.
33. Mostrar el diálogo de confirmación completo, que advierte que los datos se borran de forma permanente.
34. Confirmar → mostrar que la sesión se cierra y vuelve al login.
35. Opcional pero muy convincente: intentar iniciar sesión de nuevo con esa cuenta y mostrar que ya no existe.

---

## Después de grabar

- [ ] Revisar el video completo: que no haya pantallas trabadas, spinners eternos ni datos personales reales de terceros.
- [ ] Subirlo a un enlace **accesible sin login** (Apple no crea cuentas para ver tu video). Drive con "cualquiera con el enlace", YouTube no listado, o similar.
- [ ] Verificar el enlace **en una ventana de incógnito** antes de mandarlo.
- [ ] Pegar el enlace en el punto 1 de `APP_REVIEW_NOTES.md` y en la respuesta del hilo de App Review.
