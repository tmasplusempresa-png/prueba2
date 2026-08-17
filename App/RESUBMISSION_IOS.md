# Runbook de resubmission iOS — rechazo 2.1 Information Needed

App: TmasPlus · Bundle `tmasplus.tmasplus` · ASC app `6796166505` · Team `4G2F3UACA3`
Build rechazada por Apple: **1.10.11** (subida el 31/07/2026)

Documentos que acompañan este runbook:
- `APP_REVIEW_NOTES.md` — el texto a pegar en el campo Notes de ASC.
- `GUION_SCREEN_RECORDING.md` — qué grabar y en qué orden.

> Estos tres `.md` están **sin trackear en git**. Un `git clean` los borra (ya pasó una vez). Si los quieres conservar, commitéalos.

---

## Paso 1 — Cambios de código (HECHO)

Aplicados en `app.config.js`:

- **Purpose strings reescritas.** Estaban truncadas con `...` y mezclaban español e inglés. Ahora cada una dice qué dato se usa, para qué y con un ejemplo, como exige la 5.1.1. Corregidas en los dos sitios donde viven (`ios.infoPlist` y el plugin `expo-location`), que además ahora son idénticos — si divergen, el plugin gana en prebuild y el binario acaba mostrando un texto distinto al revisado.
- **`NSMotionUsageDescription` eliminada.** No hay un solo uso de `expo-sensors` ni `react-native-sensors` en el código.
- **ATT eliminado.** El plugin `expo-tracking-transparency` inyectaba una purpose string sobre publicidad personalizada, pero `requestTrackingPermissionsAsync` no se llama en ninguna parte y no hay ningún SDK de ads. Se quitó el plugin y se desinstaló el paquete.

Verificado con `npx expo config --type public`: las cinco purpose strings salen completas y no queda rastro de `NSUserTrackingUsageDescription`.

**Pendiente asociado:** revisa en ASC que **App Privacy no declare "Tracking"**. Si lo declara, quítalo — ahora contradice al binario.

## Paso 2 — Decidir la postura sobre membresías (BLOQUEA EL ENVÍO)

Verificado en el código: las membresías y paquetes de kilómetros se cobran contra `driverConductorId`, es decir **las paga el conductor**, no el cliente, y se llega a ellas desde su billetera.

Eso hace defendible el argumento de la Guideline 3.1.3(e): cuota de afiliación comercial para operar en la plataforma, no contenido digital. El texto ya está redactado así en el punto 5 del Notes.

Lo que tienes que hacer: **leer ese párrafo y confirmar que describe tu modelo de negocio.** Si un cliente puede comprar beneficios in-app con Daviplata, ese caso sí requiere IAP y hay que resolverlo antes de resubir.

## Paso 3 — Completar los datos que solo tienes tú

En `APP_REVIEW_NOTES.md`, reemplazar lo que esté entre `[[ ]]`:

- Modelos de iPhone y versiones de iOS probados (punto 2).
- Credenciales de la cuenta demo cliente y de la conductor (punto 4).
- Documentación de habilitación de transporte en Colombia (punto 7).
- Tu nombre en la firma.
- El enlace al video (Paso 6).

## Paso 4 — Validar las cuentas demo antes de grabar

- [ ] Entrar con la cuenta **cliente** y confirmar correo verificado y que llega al mapa sin trabarse.
- [ ] Entrar con la cuenta **conductor** y confirmar que está **aprobada**, con documentos y vehículo validados. Si aparece "pendiente de aprobación", el revisor no verá nada y el rechazo se repite.
- [ ] Confirmar que ambas apuntan a la Supabase de **producción**, contra la que corre la build de review.
- [ ] Crear una **cuenta desechable** aparte para grabar el borrado de cuenta.

## Paso 5 — Build y TestFlight

```bash
eas build --platform ios --profile production --auto-submit
```

- El contador de build es **remoto** (`appVersionSource: "remote"` con `autoIncrement`), va en 1.10.12, así que la nueva sube sola por encima de la rechazada.
- Las variables de producción en EAS ya están completas (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, llaves de Maps y Mapbox). El `.env` local está en `.easignore` y no viaja al servidor.
- `--auto-submit` sube el binario a App Store Connect, de donde pasa a TestFlight tras 10–30 min de procesamiento. **No lo envía a revisión**; eso es un paso aparte.
- Tiempo: la build de producción anterior tardó casi 4 horas entre cola y compilación.

**Testers internos** (reciben la build al instante, sin Beta App Review):
1. App Store Connect → Users and Access → invitar cada Apple ID con rol **App Manager** o **Developer**.
2. Que cada persona acepte la invitación por correo.
3. TestFlight → Internal Testing → crear grupo → agregar esas personas.
4. Asignar la build al grupo. Instalan desde la app TestFlight del iPhone.

Testers externos con enlace público existen, pero pasan por Beta App Review (~1 día). Para el equipo, usa internos.

## Paso 6 — Grabar el video

Seguir `GUION_SCREEN_RECORDING.md`. Lo crítico:

- **Verificar primero en el dispositivo que el diálogo de ubicación muestra el texto nuevo y largo.** Si sale el corto con `...`, la build no traía las correcciones.
- Empezar por el ícono en el home screen.
- Desinstalar y reinstalar antes de grabar, para que reaparezcan los diálogos de permisos.
- Cubrir los dos roles con metraje de iPhone (dos iPhones a la vez, o dos pasadas con el Android como contraparte fuera de cámara).
- Terminar con el borrado de cuenta usando la cuenta desechable.
- Subirlo a un enlace accesible sin login y **probarlo en incógnito**.

## Paso 7 — Revisar los "common issues" que Apple listó de paso

- [ ] **Screenshots (2.3.3):** que muestren la app en uso — mapa con viaje, seguimiento, pantalla de conductor — y no el splash, el logo ni el login.
- [ ] **Purpose strings (5.1.1):** resuelto en el Paso 1.
- [ ] **Suscripciones (3.1.2):** no aplica, no hay suscripciones auto-renovables de Apple.
- [ ] **Bugs y crashes (2.1):** recorrer el guion completo una vez en la build de TestFlight antes de grabar en limpio.

## Paso 8 — Enviar

1. Pegar el contenido final de `APP_REVIEW_NOTES.md` en **App Store Connect → App Review Information → Notes**.
2. Llenar los campos dedicados de cuenta demo con la cuenta **cliente**; las dos quedan detalladas en el Notes.
3. Seleccionar la build del Paso 5.
4. Responder en el hilo de App Review con el mismo texto y el enlace al video.
5. Enviar a revisión.

---

## Riesgos que quedan abiertos

- **Habilitación de transporte (punto 7).** El único punto que puede alargar la revisión de forma indefinida. Arráncalo ya.
- **Marketplace de dos lados.** Si el revisor entra solo con una cuenta, el flujo parece trabado. El Notes ofrece coordinar una ventana horaria con un conductor real en línea; si vuelven a rechazar por "no pudimos completar el viaje", esa oferta es la salida.
- **Permisos Android sin uso.** `BODY_SENSORS` y `ACTIVITY_RECOGNITION` siguen declarados sin uso en el código. No afecta a Apple, pero es el mismo hallazgo del lado de Google Play.
