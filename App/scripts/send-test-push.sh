#!/usr/bin/env bash
#
# send-test-push.sh — Dispara una notificación push de prueba vía Expo Push
# Service a UN dispositivo, sin recompilar la app ni depender de una reserva
# real. Sirve para probar canal / sonido / payload / handler en segundos.
#
# El token se crea SOLO en el dispositivo (ver components/GetPushToken.ts):
# corré la app en dev, hacé login y copiá el `[GetPushToken] Token = ...` del
# log de Metro/logcat. Después usá ese token acá.
#
# Uso:
#   ./scripts/send-test-push.sh "ExponentPushToken[xxxx]"
#   ./scripts/send-test-push.sh "ExponentPushToken[xxxx]" "Título" "Cuerpo" bookings-v2
#   EXPO_PUSH_TOKEN="ExponentPushToken[xxxx]" ./scripts/send-test-push.sh
#
# Argumentos (todos opcionales salvo el token):
#   $1  token   ExponentPushToken[...]  (o export EXPO_PUSH_TOKEN)
#   $2  título  (default: "Prueba T+Plus")
#   $3  cuerpo  (default: "Nuevo servicio disponible")
#   $4  canal   Android channelId (default: bookings-v2)
#               válidos hoy: bookings-v2, bookings-repeat-v2, messages
#
set -euo pipefail

TOKEN="${1:-${EXPO_PUSH_TOKEN:-}}"
TITLE="${2:-Prueba T+Plus}"
BODY="${3:-Nuevo servicio disponible}"
CHANNEL="${4:-bookings-v2}"

if [[ -z "$TOKEN" ]]; then
  echo "❌ Falta el token. Pasalo como primer argumento o exportá EXPO_PUSH_TOKEN." >&2
  echo "   Ej: ./scripts/send-test-push.sh \"ExponentPushToken[xxxx]\"" >&2
  exit 1
fi

if [[ "$TOKEN" != ExponentPushToken\[* ]]; then
  echo "⚠️  El token no tiene el formato ExponentPushToken[...] — ¿seguro que es el correcto?" >&2
fi

echo "→ Enviando push:"
echo "   token:  ${TOKEN:0:22}…"
echo "   título: $TITLE"
echo "   cuerpo: $BODY"
echo "   canal:  $CHANNEL"
echo

RESPONSE=$(curl -s -X POST https://exp.host/--/api/v2/push/send \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "to": "$TOKEN",
  "title": "$TITLE",
  "body": "$BODY",
  "sound": "default",
  "channelId": "$CHANNEL",
  "priority": "high",
  "data": { "origen": "send-test-push", "channelId": "$CHANNEL" }
}
JSON
)

echo "← Respuesta de Expo:"
echo "$RESPONSE"
echo

# Detecta error de ticket (token inválido, DeviceNotRegistered, etc.) sin
# depender de jq: Expo devuelve "status":"error" en el ticket cuando falla.
if echo "$RESPONSE" | grep -q '"status":"error"'; then
  echo "❌ Expo reportó un error en el ticket (ver 'message'/'details' arriba)." >&2
  echo "   Causas típicas: token inválido/viejo, o el dispositivo desinstaló la app (DeviceNotRegistered)." >&2
  exit 2
fi

echo "✅ Ticket aceptado por Expo. Si no llega al dispositivo, revisá:"
echo "   • permisos de notificación concedidos en el dispositivo,"
echo "   • que el channelId '$CHANNEL' exista (se crean en GetPushToken.ts),"
echo "   • en Android, que la app no esté en optimización de batería agresiva."
