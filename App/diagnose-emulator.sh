#!/bin/bash
# Script para diagnosticar problemas de conexión del emulador Android

echo "🔍 Diagnóstico del Emulador Android"
echo "=================================="
echo ""

# Verificar si ADB está disponible
if ! command -v adb &> /dev/null; then
    echo "❌ ADB no está instalado o no está en PATH"
    echo "   Instálalo desde: https://developer.android.com/studio"
    exit 1
fi

echo "✅ ADB encontrado"
echo ""

# Verificar si hay emuladores conectados
echo "📱 Buscando emuladores conectados..."
DEVICES=$(adb devices | grep -v "List of attached devices" | grep -v "^$")

if [ -z "$DEVICES" ]; then
    echo "❌ No hay emuladores conectados"
    echo "   Inicia un emulador desde Android Studio"
    exit 1
fi

echo "✅ Emulador(es) encontrado(s):"
echo "$DEVICES"
echo ""

# Obtener el ID del primer emulador
EMULATOR_ID=$(echo "$DEVICES" | head -1 | awk '{print $1}')

echo "🔧 Usando emulador: $EMULATOR_ID"
echo ""

# Test 1: Ping a Google DNS
echo "1️⃣ Test de conexión a Internet (ping 8.8.8.8)..."
PING_RESULT=$(adb -s "$EMULATOR_ID" shell ping -c 1 8.8.8.8 2>&1)
if echo "$PING_RESULT" | grep -q "1 packets received"; then
    echo "✅ Emulador TIENE acceso a Internet"
else
    echo "❌ Emulador NO tiene acceso a Internet"
    echo "   Soluciones:"
    echo "   1. Reinicia el emulador"
    echo "   2. Ve a Settings > About emulated device > Advanced"
    echo "   3. Verifica que la conexión esté habilitada"
fi
echo ""

# Test 2: Verificar DNS
echo "2️⃣ Test de resolución DNS..."
DNS_RESULT=$(adb -s "$EMULATOR_ID" shell nslookup supabase.co 8.8.8.8 2>&1)
if echo "$DNS_RESULT" | grep -q "Address"; then
    echo "✅ DNS funcionando correctamente"
    echo "$DNS_RESULT" | grep -A1 "Address"
else
    echo "⚠️ Problema con DNS"
fi
echo ""

# Test 3: Verificar acceso a Supabase
echo "3️⃣ Test de conexión a Supabase..."
SUPABASE_RESULT=$(adb -s "$EMULATOR_ID" shell curl -I https://utofhxgzkdhljrixperh.supabase.co 2>&1 | head -5)
if echo "$SUPABASE_RESULT" | grep -q "HTTP"; then
    echo "✅ Puedes alcanzar Supabase"
    echo "$SUPABASE_RESULT"
else
    echo "❌ No puedes alcanzar Supabase"
    echo "   Verifica que:"
    echo "   1. El emulador tenga Internet"
    echo "   2. Tu firewall no esté bloqueando"
    echo "   3. No estés usando VPN"
fi
echo ""

# Test 4: Configuración de red del emulador
echo "4️⃣ Configuración de red del emulador..."
adb -s "$EMULATOR_ID" shell getprop ro.kernel.qemu.net.speed
adb -s "$EMULATOR_ID" shell getprop ro.kernel.qemu.net.delay
echo ""

echo "✅ Diagnóstico completado"
