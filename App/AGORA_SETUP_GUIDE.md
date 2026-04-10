# 📞 Sistema de Llamadas P2P con Agora - Guía de Setup

## Overview

Se ha implementado un **sistema de llamadas P2P dentro de la app** usando **Agora RTC SDK**. Esto permite:

- ✅ Llamadas de audio entre usuario y conductor
- ✅ Control de micrófono y altavoz
- ✅ Duración de llamada en tiempo real
- ✅ Modal de llamada entrante
- ✅ Interface elegante y moderna
- ✅ Fallback a llamadas nativas si Agora falla

## Requisitos

### 1. **Crear una cuenta en Agora**

1. Ve a: https://console.agora.io
2. Crea una cuenta (gratis)
3. Crea un nuevo proyecto
4. Copia tu **App ID**
5. Guarda en tu `.env`:
   ```
   AGORA_APP_ID=tu_app_id_aqui
   ```

⚡ **Durante desarrollo**: Puedes usar el App ID de prueba incluido (limitado):
```
AGORA_APP_ID=8a0861d85c5d45e9813ee0b967e12d6c
```

### 2. **Instalar dependencia** (ya hecho)

```bash
npm install react-native-agora
```

## Arquitectura

### Componentes

```
CallService                    ← Logica Agora (singleton)
    ↓
useAgoraCall (Hook)           ← State management
    ↓
IncomingCallModal             ← UI llamada entrante
    ├─ Acepta/rechaza
    └─ Animaciones
    
ActiveCallScreen              ← UI llamada activa
    ├─ Mute/Speaker controls
    ├─ Duración en vivo
    └─ Botón colgar

ReservationTripScreen         ← Integración en pantalla
    ├─ Button "📞 Llamar" → makeCall()
    └─ Recibe llamadas entrantes
```

## Flujo de Uso

### Usuario hace llamada (Conductor → Cliente)

```
1. Conductor toca botón "📞 Llamar"
   ↓
2. callManager.makeCall(customerData)
   ↓
3. Se abre ActiveCallScreen
   ↓
4. Se unen al mismo canal Agora
   ↓
5. Llamada P2P completada ✓
```

### Usar sistema de notificaciones

**⚠️ IMPORTANTE**: Para que el cliente RECIBA la llamada:

Necesitas adicionar en tu backend (Firebase/Supabase):

```typescript
// Cuando conductor hace llamada:
async function notifyCustomerOfCall(customerId, callData) {
  // Enviar push notification al cliente
  await sendPushNotification(customerId, {
    title: '📞 Llamada entrante',
    body: `${callerName} te está llamando...`,
    data: {
      type: 'incoming_call',
      channelName: callData.channel,
      callerId: callData.callerId,
      callerName: callData.callerName,
      callerPhone: callData.callerPhone,
    }
  });
}
```

Luego en el cliente:

```typescript
// Escuchar push notification
notificationListener.onNotificationReceived((notification) => {
  if (notification.data.type === 'incoming_call') {
    callManager.simulateIncomingCall({
      userId: notification.data.callerId,
      name: notification.data.callerName,
      phone: notification.data.callerPhone,
    });
  }
});
```

## API del Hook useAgoraCall

```typescript
const {
  // Estados
  isCallActive,           // boolean - llamada en curso?
  callDuration,           // number - segundos
  isMuted,               // boolean - micrófono mutea?
  isSpeakerEnabled,      // boolean - altavoz activo?
  remoteUser,            // CallUserInfo | null
  incomingCall,          // CallUserInfo | null
  channelName,           // string - canal actual

  // Acciones
  makeCall,              // (user) → Promise<void>
  acceptCall,            // (user) → Promise<void>
  rejectCall,            // () → void
  endCall,               // () → Promise<void>
  toggleMute,            // () → Promise<void>
  toggleSpeaker,         // () → Promise<void>
  simulateIncomingCall,  // (user) → void (para testing)
} = useAgoraCall(options);
```

## Testing Local

### Simular llamada entrante (en desarrollo):

```typescript
// En ReservationTripScreen o cualquier componente:
const handleTestIncomingCall = () => {
  callManager.simulateIncomingCall({
    userId: 'test_caller_123',
    name: 'Cliente Test',
    phone: '+573001234567',
    image: undefined,
  });
};
```

### Probar en dos dispositivos

1. **Dispositivo A (Conductor)**: 
   - Inicia sesión como conductor
   - Abre ReservationTripScreen
   - Toca botón "📞 Llamar"

2. **Dispositivo B (Cliente)**:
   - Inicia sesión como cliente
   - Implementar escucha en push notifications
   - Recibirá `IncomingCallModal`

## Configuración Avanzada

### Tokens de Seguridad (Producción)

```typescript
// Backend (Node.js)
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

app.get('/api/call-token', (req, res) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const channelName = req.query.channel;
  const uid = parseInt(req.query.uid);
  const expirationTimeInSeconds = 3600;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    expirationTimeInSeconds
  );

  res.json({ token });
});

// Cliente
const tokenResponse = await fetch('/api/call-token?channel=...&uid=...');
const { token } = await tokenResponse.json();
await callManager.joinChannel(channel, userId, token);
```

### Calidad de Audio

```typescript
// En CallService.ts
await engine.setAudioProfile(
  0, // 0=default, 1=high quality, 2=speech
  1  // 0=default, 1=speech, 2=music
);
```

## Troubleshooting

### ❌ "Agora not initialized"
- Verifica que `AGORA_APP_ID` esté configurado
- Check console para errors

### ❌ "Usuario remoto no se conecta"
- Verifica que ambos dispositivos estén en el **MISMO canal**
- Check: `CallService.generateChannelId(uid1, uid2)`
- Debe ser determinístico (mismo para ambos)

### ❌ "Audio no se escucha"
- Verifica permisos: `<uses-permission android:name="android.permission.RECORD_AUDIO" />`
- Check si Expo autentificó request de audio

### ❌ Error 400 en RPC
- Afecta a `search_immediate_bookings()` pero NO a llamadas
- Las llamadas usando fallback query funcionan normalmente

## Archivos Creados

```
common/services/
  ├─ CallService.ts              ← Lógica Agora pura

components/
  ├─ IncomingCallModal.tsx       ← Modal llamada entrante
  └─ ActiveCallScreen.tsx        ← Pantalla llamada activa

hooks/
  └─ useAgoraCall.ts             ← Hook personalizado

config/
  └─ AgoraConfig.ts              ← Configuración centralizada

app/(tabs)/
  └─ ReservationTripScreen.tsx   ← Integración (modificado)
```

## Next Steps

1. ✅ Obtener App ID de Agora
2. ✅ Agregar en `.env`: `AGORA_APP_ID=xxx`
3. ✅ Implementar notificaciones push (Firebase/Supabase)
4. ✅ Generar tokens en backend (para producción)
5. ✅ Testear en dos dispositivos reales
6. ✅ (Opcional) Agregar video en futuro

## Costos

- **Primeros 1,000 minutos/mes**: GRATIS
- **Después**: ~$0.99 USD por 1,000 minutos
- Personal projects: Gratis indefinidamente con cuenta educacional

## Soporte

- Docs: https://docs.agora.io/en/video-call/overview
- Community: https://agoracommunity.github.io

---

**Status**: ✅ Implementado y ready para testing
