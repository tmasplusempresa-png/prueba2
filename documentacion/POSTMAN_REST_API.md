# T+Plus — Colección REST API para Postman

## Variables globales (configurar en Postman)

| Variable | Valor |
|----------|-------|
| `BASE_URL` | `https://utofhxgzkdhljrixperh.supabase.co` |
| `ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0b2ZoeGd6a2RobGpyaXhwZXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzAzNTcsImV4cCI6MjA3MjYwNjM1N30.m3I2UMBCDz8b3TwChMpws53B3FtvhCL9nydaYbOydew` |
| `AUTH_ID` | `fd8fec1a-6660-4357-ad4f-a0372f43a1ae` *(tu auth_id de prueba)* |
| `USER_SESSION_TOKEN` | *(pegar el access_token de AsyncStorage key `tmasplus_auth_session`)* |

### Cómo obtener el `USER_SESSION_TOKEN`

En la consola de Metro/React Native ejecutar:
```js
import AsyncStorage from '@react-native-async-storage/async-storage';
const s = await AsyncStorage.getItem('tmasplus_auth_session');
console.log(JSON.parse(s).access_token);
```
O desde Postman, usar la petición **0. Login** de abajo.

---

## Headers comunes

Todas las peticiones llevan estos headers base:

```
apikey: {{ANON_KEY}}
Authorization: Bearer {{ANON_KEY}}   ← para lecturas (GET)
               Bearer {{USER_SESSION_TOKEN}}  ← para escrituras (PATCH/POST) que pasan por RLS
Content-Type: application/json
```

---

## 0. Login (obtener session token)

> **POST** `{{BASE_URL}}/auth/v1/token?grant_type=password`

**Headers:**
```
apikey: {{ANON_KEY}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "andresfelipecristancho2014@gmail.com",
  "password": "TU_PASSWORD_AQUI"
}
```

**Respuesta esperada (200):**
```json
{
  "access_token": "eyJhbG...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": { "id": "fd8fec1a-...", ... }
}
```

> Copiar el `access_token` en la variable `USER_SESSION_TOKEN`.

---

## 1. Obtener perfil completo del usuario

> **GET** `{{BASE_URL}}/rest/v1/users?or=(auth_id.eq.{{AUTH_ID}},id.eq.{{AUTH_ID}})&limit=1`

**Usado en:** `DocumentsScreen.tsx` (carga de datos personales)

**Headers:**
```
apikey: {{ANON_KEY}}
Authorization: Bearer {{ANON_KEY}}
Content-Type: application/json
```

**Respuesta esperada (200):**
```json
[
  {
    "id": "fd8fec1a-...",
    "auth_id": "fd8fec1a-...",
    "email": "andresfelipecristancho2014@gmail.com",
    "first_name": "Andrés",
    "last_name": "Cristancho",
    "mobile": "+573001234567",
    "user_type": "driver",
    "city": "Bogotá",
    "referral_id": "ABC123",
    "license_number": "...",
    "wallet_balance": 0,
    "rating": 5,
    "profile_image": null,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

## 2. Obtener nombre y teléfono (perfil resumido)

> **GET** `{{BASE_URL}}/rest/v1/users?or=(auth_id.eq.{{AUTH_ID}},id.eq.{{AUTH_ID}})&select=first_name,last_name,mobile&limit=1`

**Usado en:** `ProfileScreen.tsx` (tarjeta de usuario en menú)

**Headers:**
```
apikey: {{ANON_KEY}}
Authorization: Bearer {{ANON_KEY}}
Content-Type: application/json
```

**Respuesta esperada (200):**
```json
[
  {
    "first_name": "Andrés",
    "last_name": "Cristancho",
    "mobile": "+573001234567"
  }
]
```

---

## 3. Obtener nombre para voz (speaker greeting)

> **GET** `{{BASE_URL}}/rest/v1/users?or=(auth_id.eq.{{AUTH_ID}},id.eq.{{AUTH_ID}})&select=first_name,last_name&limit=1`

**Usado en:** `index.tsx` → `resolveDriverName()`

**Headers:**
```
apikey: {{ANON_KEY}}
Authorization: Bearer {{ANON_KEY}}
Content-Type: application/json
```

**Respuesta esperada (200):**
```json
[
  {
    "first_name": "Andrés",
    "last_name": "Cristancho"
  }
]
```

---

## 4. Actualizar datos personales del usuario

> **PATCH** `{{BASE_URL}}/rest/v1/users?auth_id=eq.{{AUTH_ID}}`

**Usado en:** `DocumentsScreen.tsx` → `handleUpdate()`

**Headers:**
```
apikey: {{ANON_KEY}}
Authorization: Bearer {{USER_SESSION_TOKEN}}
Content-Type: application/json
Prefer: return=representation
```

> ⚠️ Requiere `USER_SESSION_TOKEN` (no anon key) para pasar RLS en escritura.

**Body (raw JSON):**
```json
{
  "first_name": "Andrés",
  "last_name": "Cristancho",
  "mobile": "+573001234567",
  "city": "Bogotá",
  "referral_id": "ABC123",
  "license_number": "DRV-001",
  "updated_at": "2026-03-18T12:00:00.000Z"
}
```

**Respuesta esperada (200):**
```json
[
  {
    "id": "fd8fec1a-...",
    "auth_id": "fd8fec1a-...",
    "first_name": "Andrés",
    "last_name": "Cristancho",
    "mobile": "+573001234567",
    "city": "Bogotá",
    ...
  }
]
```

**Si devuelve `[]` vacío:** El token de sesión no tiene permiso RLS o el `auth_id` no coincide.

---

## 5. Resolver driver_id (obtener id UUID del conductor)

> **GET** `{{BASE_URL}}/rest/v1/users?or=(auth_id.eq.{{AUTH_ID}},id.eq.{{AUTH_ID}})&select=id&limit=1`

**Usado en:** `CarsEditScreen.tsx` → `resolveDriverId()`

**Headers:**
```
apikey: {{ANON_KEY}}
Authorization: Bearer {{ANON_KEY}}
Content-Type: application/json
```

**Respuesta esperada (200):**
```json
[
  {
    "id": "fd8fec1a-6660-4357-ad4f-a0372f43a1ae"
  }
]
```

---

## 6. Crear vehículo (INSERT en tabla cars)

> **POST** `{{BASE_URL}}/rest/v1/cars`

**Usado en:** `CarsEditScreen.tsx` → `handleAddCar()`

**Headers:**
```
apikey: {{ANON_KEY}}
Authorization: Bearer {{ANON_KEY}}
Content-Type: application/json
Prefer: return=representation
```

**Body (raw JSON):**
```json
{
  "driver_id": "fd8fec1a-6660-4357-ad4f-a0372f43a1ae",
  "make": "Chevrolet",
  "model": "2020",
  "plate": "ABC123",
  "color": "Blanco",
  "fuel_type": "Gasolina",
  "transmission": "MECANICO",
  "capacity": 4,
  "is_active": false,
  "features": {
    "vehicleNoMotor": "MOT123456",
    "vehicleNoChasis": "CHA789012",
    "vehicleNoVin": "",
    "vehicleNoSerie": "",
    "vehicleForm": "AUTOMOVIL",
    "vehicleCylinders": "1600",
    "vehicleDoors": "4",
    "vehicleMetalup": "Sedán",
    "carType": "TREAS-X"
  }
}
```

**Respuesta esperada (201):**
```json
[
  {
    "id": "nuevo-uuid-generado",
    "driver_id": "fd8fec1a-...",
    "make": "Chevrolet",
    "model": "2020",
    "plate": "ABC123",
    ...
  }
]
```

---

## 7. Buscar vehículo por conductor y placa

> **GET** `{{BASE_URL}}/rest/v1/cars?driver_id=eq.{{AUTH_ID}}&plate=eq.ABC123&order=created_at.desc&limit=1&select=id`

**Usado en:** `CarsEditScreen.tsx` (fallback para obtener id del vehículo recién creado)

**Headers:**
```
apikey: {{ANON_KEY}}
Authorization: Bearer {{ANON_KEY}}
Content-Type: application/json
```

**Respuesta esperada (200):**
```json
[
  {
    "id": "car-uuid-aqui"
  }
]
```

---

## 8. Subir imagen de vehículo (Storage)

> **POST** `{{BASE_URL}}/storage/v1/object/vehicle-images/{CAR_ID}/car_image.jpg`

**Usado en:** `CarsEditScreen.tsx` (subida de foto del vehículo)

Reemplazar `{CAR_ID}` con el UUID del vehículo creado.

**Headers:**
```
apikey: {{ANON_KEY}}
Authorization: Bearer {{ANON_KEY}}
Content-Type: image/jpeg
x-upsert: true
```

**Body:** Seleccionar tipo `binary` en Postman y adjuntar un archivo `.jpg`.

**Respuesta esperada (200):**
```json
{
  "Key": "vehicle-images/{CAR_ID}/car_image.jpg",
  "Id": "..."
}
```

**URL pública resultante:**
```
{{BASE_URL}}/storage/v1/object/public/vehicle-images/{CAR_ID}/car_image.jpg
```

---

## 9. Actualizar imagen del vehículo en tabla cars

> **PATCH** `{{BASE_URL}}/rest/v1/cars?id=eq.{CAR_ID}`

**Usado en:** `CarsEditScreen.tsx` (asociar URL de imagen al registro)

Reemplazar `{CAR_ID}` con el UUID del vehículo.

**Headers:**
```
apikey: {{ANON_KEY}}
Authorization: Bearer {{ANON_KEY}}
Content-Type: application/json
Prefer: return=representation
```

**Body (raw JSON):**
```json
{
  "car_image": "https://utofhxgzkdhljrixperh.supabase.co/storage/v1/object/public/vehicle-images/{CAR_ID}/car_image.jpg",
  "updated_at": "2026-03-18T12:00:00.000Z"
}
```

**Respuesta esperada (200):**
```json
[
  {
    "id": "{CAR_ID}",
    "car_image": "https://utofhxgzkdhljrixperh.supabase.co/storage/v1/object/public/vehicle-images/{CAR_ID}/car_image.jpg",
    ...
  }
]
```

---

## Códigos de error comunes

| Código | Significado | Solución |
|--------|-------------|----------|
| `200` | OK (GET/PATCH exitoso) | — |
| `201` | Creado (POST exitoso) | — |
| `401` | No autorizado | Verificar `apikey` y `Authorization` |
| `403` | Prohibido por RLS | Usar `USER_SESSION_TOKEN` en lugar de `ANON_KEY` |
| `404` | Ruta no encontrada | Verificar URL y nombre de tabla |
| `409` | Conflicto (duplicado) | La placa o ID ya existe |
| `[]` vacío en PATCH | RLS bloqueó la escritura | El token no coincide con el `auth_id` del row |

---

## Orden de prueba recomendado

1. **Login** (petición 0) → obtener `access_token`
2. **GET perfil completo** (petición 1) → verificar que el usuario existe
3. **GET nombre resumido** (petición 2) → verificar select parcial
4. **PATCH actualizar perfil** (petición 4) → cambiar un campo y verificar
5. **GET perfil completo** (petición 1) → confirmar que el cambio persistió
6. **POST crear vehículo** (petición 6) → anotar el `id` devuelto
7. **GET buscar vehículo** (petición 7) → confirmar que existe
8. **POST subir imagen** (petición 8) → con el `id` del paso 6
9. **PATCH asociar imagen** (petición 9) → vincular URL al vehículo
10. **GET buscar vehículo** (petición 7) → confirmar `car_image` tiene URL

---

## Tablas y columnas relevantes

### `users`
```
id, auth_id, email, first_name, last_name, mobile, user_type,
wallet_balance, location, profile_image, rating, total_rides,
is_verified, approved, blocked, referral_id, city,
driver_active_status, license_number, license_image, license_image_back,
soat_image, card_prop_image, card_prop_image_bk,
verify_id_image, verify_id_image_bk, push_token, user_platform,
created_at, updated_at, car_type, car_image, vehicle_number,
vehicle_make, company_name, total_trips, total_earnings,
is_active, verified
```

### `cars`
```
id, driver_id, make, model, year, color, plate, car_image,
vehicle_number, vehicle_model, vehicle_make, vehicle_color,
fuel_type, transmission, capacity, is_active, features,
created_at, updated_at
```

### Storage bucket: `vehicle-images`
```
Ruta: vehicle-images/{car_id}/car_image.jpg
URL pública: {{BASE_URL}}/storage/v1/object/public/vehicle-images/{car_id}/car_image.jpg
```
