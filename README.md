# T+Plus - Proyecto Completo 2026

Proyecto completo que incluye la aplicación móvil (React Native/Expo) y el dashboard web (React/Vite) para la plataforma T+Plus.

## 📁 Estructura del Proyecto

```
Proyecto 2026/
├── App_TmasPlus_desarrollo/     # Aplicación móvil (React Native + Expo)
└── TmasPlus_webSite-master/     # Dashboard web (React + Vite)
```

---

## 🚀 Configuración Inicial

### Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior) - [Descargar aquí](https://nodejs.org/)
- **Git** - [Descargar aquí](https://git-scm.com/)
- **npm** o **yarn** (viene con Node.js)

#### Para la Aplicación Móvil (adicional):
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app en tu dispositivo móvil ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

---

## 📥 Clonar el Repositorio

### En Windows (PowerShell o CMD):

```powershell
cd Desktop
git clone <URL_DE_TU_REPOSITORIO>
cd "Proyecto 2026"
```

### En Mac/Linux (Terminal):

```bash
cd Desktop
git clone <URL_DE_TU_REPOSITORIO>
cd "Proyecto 2026"
```

---

## ⚙️ Configuración del Dashboard Web

### 1. Navegar a la carpeta del dashboard

**Windows:**
```powershell
cd TmasPlus_webSite-master
```

**Mac/Linux:**
```bash
cd TmasPlus_webSite-master
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

**Windows:**
```powershell
Copy-Item .env.example -Destination .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

Luego edita el archivo `.env` con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

El dashboard estará disponible en: **http://localhost:5173**

---

## 📱 Configuración de la Aplicación Móvil

### 1. Navegar a la carpeta de la app

Desde la raíz del proyecto:

**Windows:**
```powershell
cd App_TmasPlus_desarrollo
```

**Mac/Linux:**
```bash
cd App_TmasPlus_desarrollo
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Si existe un archivo `.env.example`, cópialo:

**Windows:**
```powershell
if (Test-Path .env.example) { Copy-Item .env.example -Destination .env }
```

**Mac/Linux:**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales.

### 4. Iniciar la aplicación con Expo

```bash
npx expo start -c
```

Opciones:
- Presiona `a` para abrir en Android Emulator
- Presiona `i` para abrir en iOS Simulator (solo Mac)
- Escanea el QR con la app Expo Go en tu móvil

---

## 🗄️ Configuración de Base de Datos (Supabase)

Ambos proyectos se conectan a **Supabase**. Asegúrate de tener:

1. Una cuenta en [Supabase](https://supabase.com/)
2. Un proyecto creado
3. Las credenciales (`URL` y `ANON_KEY`)

### Tablas principales:

- `users` - Usuarios del sistema (customers, drivers, admin)
- `bookings` - Reservas de viajes
- `cars` - Vehículos registrados

---

## 🛠️ Scripts Disponibles

### Dashboard Web (TmasPlus_webSite-master)

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Compila para producción
npm run preview      # Vista previa de la build
npm run lint         # Ejecuta el linter
```

### App Móvil (App_TmasPlus_desarrollo)

```bash
npx expo start -c             # Inicia Expo con caché limpio
npm run android              # Ejecuta en Android
npm run ios                  # Ejecuta en iOS (solo Mac)
npm run web                  # Ejecuta versión web
```

---

## 📝 Notas Importantes

### Para Usuarios de Mac:

- Si encuentras problemas con permisos, usa `sudo`:
  ```bash
  sudo npm install -g expo-cli
  ```

- Para ejecutar en iOS Simulator, necesitas Xcode instalado:
  ```bash
  xcode-select --install
  ```

### Para Usuarios de Windows:

- Ejecuta PowerShell como Administrador si tienes problemas de permisos
- Para Android, instala [Android Studio](https://developer.android.com/studio)

### Problemas Comunes:

1. **Error "Cannot find module"**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Puerto ocupado**:
   - Dashboard Web: Cambia el puerto en `vite.config.ts`
   - Expo: El puerto se asigna automáticamente

3. **Error de conexión a Supabase**:
   - Verifica que el archivo `.env` existe y tiene las credenciales correctas
   - Ejecuta: `npx tsx test-db-connection.ts` (solo en el dashboard)

---

## 🔐 Seguridad

**IMPORTANTE:** 

- ⚠️ **NUNCA** subas el archivo `.env` a Git
- ⚠️ Las credenciales de Supabase deben mantenerse privadas
- ⚠️ Usa `.env.example` como plantilla (sin credenciales reales)

---

## 👥 Estructura de Usuarios

La plataforma maneja 3 tipos de usuarios:

- **Customer** - Clientes que solicitan viajes
- **Driver** - Conductores que aceptan viajes
- **Admin** - Administradores del sistema

---

## 📞 Soporte

Para problemas o preguntas:

1. Verifica que todas las dependencias estén instaladas
2. Revisa que las variables de entorno estén configuradas
3. Consulta la documentación de [Expo](https://docs.expo.dev/) o [Vite](https://vitejs.dev/)

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados © 2026

---

**Última actualización:** Febrero 2026
