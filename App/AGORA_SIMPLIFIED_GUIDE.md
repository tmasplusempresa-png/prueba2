# 📞 Sistema de Llamadas P2P - Agora UIKit (Simplificado)

## ✅ Estado Actual

**Versión mejorada**: Ahora usa `agora-rn-uikit` que incluye UI completa pre-construida.

- ✅ Instalado: `react-native-agora` + `agora-rn-uikit`
- ✅ Componentes listos:
  - `AgoraCallModal` - Modal con UI completa
  - `useAgoraCall()` - Hook para estado
  - `CallService` - Utilidades
- ✅ Integrado en `ReservationTripScreen`
- ✅ App ID configurado: `e7f6e9aeecf14b2ba10e3f40be9f56e7`

## 🎯 Flujo de Uso

### Usuario llama desde ReservationTripScreen

```
1. Conductor abre "En viaje" (ReservationTripScreen)
2. Toca botón "📞 Llamar cliente"
3. Se abre AgoraCallModal con UI de Agora
4. La interfaz muestra:
   - Video/audio del cliente
   - Botones de controles (mute, speaker, etc)
   - Contador de duración
   - Botón para colgar
5. Terminar llamada con "Terminar llamada"
```

## 📦 Componentes

### AgoraCallModal.tsx

```typescript
<AgoraCallModal
  visible={callManager.callActive}        // ¿Modal abierto?
  appId="e7f6e9aeecf14b2ba10e3f40be9f56e7"
  channel="call_driver_client_123"        // Nombre del canal
  token={null}                            // Token (null para desarrollo)
  uid={12345}                             // User ID numérico
  userName="Juan Conductor"
  onClose={() => callManager.endCall()}   // Al cerrar
/>
```

### useAgoraCall Hook

```typescript
const callManager = useAgoraCall({
  appId: 'e7f6e9aeecf14b2ba10e3f40be9f56e7',
  userId: user.id,
  userName: user.name,
  userPhone: user.phone,
});

// Estados disponibles
callManager.callActive;     // boolean
callManager.channelName;    // string
callManager.remoteUser;     // { userId, name, phone, image }
callManager.token;          // string | null

// Acciones
callManager.makeCall(userInfo);     // Iniciar llamada
callManager.acceptCall(userInfo);   // Aceptar llamada
callManager.endCall();              // Terminar llamada
```

## 🚀 Development Setup

### 1. App ID configurado ✅

```typescript
// config/AgoraConfig.ts
AGORA_APP_ID = 'e7f6e9aeecf14b2ba10e3f40be9f56e7'
```

### 2. Reinicia app

```bash
npm start
```

### 3. Test

```
1. Abre ReservationTripScreen
2. Toca "📞 Llamar"
3. Debería abrir AgoraCallModal con UI de Agora
```

## 🔧 Configuración Avanzada

### Tokens de Seguridad (Producción)

Para producción, **SIEMPRE** genera tokens en tu servidor:

```typescript
// Backend (Node.js)
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

app.get('/api/agora-token', (req, res) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const channelName = req.query.channel;
  const uid = parseInt(req.query.uid);
  
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    3600  // 1 hora
  );
  
  res.json({ token });
});
```

```typescript
// Cliente
const response = await fetch(`/api/agora-token?channel=${channel}&uid=${uid}`);
const { token } = await response.json();

callManager.makeCall(userData, token); // Pasar token
```

### Notificaciones para Usuario Remoto

**El cliente DEBE recibir una push notification para ver la llamada entrante:**

```typescript
// Backend - cuando conductor llama
async function notifyCustomerOfCall(customerId, callData) {
  await sendPushNotification(customerId, {
    title: '📞 Llamada de ' + driverName,
    body: 'Alguien te está llamando...',
    data: {
      type: 'incoming_call',
      channelName: callData.channel,
      driverId: callData.driverId,
      driverName: callData.driverName,
    }
  });
}
```

```typescript
// Cliente - escuchar en App.tsx
import { useNotifications } from '@/hooks/useNotifications';

const App = () => {
  const { notification } = useNotifications();
  
  useEffect(() => {
    if (notification?.data?.type === 'incoming_call') {
      // Aquí aceptar/rechazar la llamada
      callManager.acceptCall({
        userId: notification.data.driverId,
        name: notification.data.driverName,
        phone: 'En llamada',
      });
    }
  }, [notification]);
};
```

## 📊 Arquitectura

```
ReservationTripScreen
    ↓
useAgoraCall Hook
    ├─ callActive
    ├─ channelName
    ├─ remoteUser
    └─ makeCall(), acceptCall(), endCall()
    ↓
AgoraCallModal
    ├─ AgoraUIKit (pre-built UI)
    └─ connectionData = { appId, channel, token }
```

## 🐛 Troubleshooting

### ❌ AgoraUIKit no renderiza

**Solución:**
```typescript
// Asegúrate de tener correctamente el connectionData
const connectionData = {
  appId: 'e7f6e9aeecf14b2ba10e3f40be9f56e7',  // Requerido
  channel: 'test_channel',                      // Requerido
  token: null,                                  // OK para dev
};
```

### ❌ "Unable to initialize"

- Verifica App ID válido
- Check internet connection
- Permisos de audio: `android:name="android.permission.RECORD_AUDIO"`

### ❌ Otro usuario no ve la llamada

- ⚠️ Necesitas push notifications
- Ambos deben estar en el **MISMO canal** (calculateChannel ID es determinístico)
- Token debe ser válido (o null en dev)

## 📱 Archivos Modificados

```
components/
  ├─ AgoraCallModal.tsx           ← NUEVO: Modal con UIKit
  ├─ IncomingCallModal.tsx         ← Ya no se usa
  └─ ActiveCallScreen.tsx          ← Ya no se usa

hooks/
  └─ useAgoraCall.ts              ← SIMPLIFICADO

services/
  └─ CallService.ts               ← SIMPLIFICADO

config/
  └─ AgoraConfig.ts               ← App ID configurado

ReservationTripScreen.tsx          ← Integrado
```

## ✨ Mejoras Hechas

| Aspecto | Antes | Ahora |
|--------|-------|-------|
| **UI** | Custom (100+ líneas) | Pre-built (UIKit) ✨ |
| **Setup** | Complejo | Simple ✨ |
| **Líneas código** | ~400 | ~150 ✨ |
| **Controles** | Manual | Auto incluidos ✨ |
| **Duración** | Manual | Auto ✨ |
| **Testing** | Difícil | Fácil ✨ |

## 🎯 Next Steps

1. ✅ App ID listo
2. ⏳ Agregar notificaciones push (backend)
3. ⏳ Testing entre dos dispositivos
4. ⏳ Generar tokens en backend (producción)
5. ⏳ (Opcional) Agregar video en futuro

## 📚 Recursos

- Agora UIKit Docs: https://docs.agora.io/en/real-time-communication
- React Native UIKit: https://github.com/AgoraIO-Community/react-native-agora/tree/main/react-native-agora-rtc-ng

---

**Status**: ✅ Listo para desarrollo
**App ID**: `e7f6e9aeecf14b2ba10e3f40be9f56e7` (del ejemplo)
