# Script para diagnosticar problemas de conexión del emulador Android (Windows)

Write-Host "🔍 Diagnóstico del Emulador Android"
Write-Host "===================================="
Write-Host ""

# Verificar si ADB está disponible
try {
    $adbVersion = adb version 2>&1 | Select-Object -First 1
    Write-Host "✅ ADB encontrado: $adbVersion"
} catch {
    Write-Host "❌ ADB no está instalado o no está en PATH"
    Write-Host "   Instálalo desde: https://developer.android.com/studio"
    Exit 1
}

Write-Host ""

# Verificar si hay emuladores conectados
Write-Host "📱 Buscando emuladores conectados..."
$devices = adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }

if (!$devices) {
    Write-Host "❌ No hay emuladores conectados"
    Write-Host "   Inicia un emulador desde Android Studio"
    Exit 1
}

Write-Host "✅ Emulador(es) encontrado(s):"
$devices | ForEach-Object { Write-Host "   $_" }
Write-Host ""

# Obtener el ID del primer emulador
$emulatorId = ($devices[0] -split "\s+")[0]

Write-Host "🔧 Usando emulador: $emulatorId"
Write-Host ""

# Test 1: Ping a Google DNS
Write-Host "1️⃣ Test de conexión a Internet (ping 8.8.8.8)..."
try {
    $pingResult = adb -s "$emulatorId" shell ping -c 1 8.8.8.8 2>&1
    if ($pingResult -match "1 packets received") {
        Write-Host "✅ Emulador TIENE acceso a Internet"
    } else {
        Write-Host "❌ Emulador NO tiene acceso a Internet"
        Write-Host "   Soluciones:"
        Write-Host "   1. Reinicia el emulador"
        Write-Host "   2. Ve a Settings > About emulated device > Advanced"
        Write-Host "   3. Verifica que la conexión esté habilitada"
    }
} catch {
    Write-Host "❌ Error ejecutando ping: $_"
}
Write-Host ""

# Test 2: Verificar DNS
Write-Host "2️⃣ Test de resolución DNS..."
try {
    $dnsResult = adb -s "$emulatorId" shell nslookup supabase.co 8.8.8.8 2>&1
    if ($dnsResult -match "Address") {
        Write-Host "✅ DNS funcionando correctamente"
        $dnsResult | Where-Object { $_ -match "Address" } | Select-Object -First 2 | ForEach-Object { Write-Host "   $_" }
    } else {
        Write-Host "⚠️ Problema con DNS"
    }
} catch {
    Write-Host "❌ Error en DNS: $_"
}
Write-Host ""

# Test 3: Verificar acceso a Supabase
Write-Host "3️⃣ Test de conexión a Supabase..."
try {
    $supabaseResult = adb -s "$emulatorId" shell curl -I https://utofhxgzkdhljrixperh.supabase.co 2>&1 | Select-Object -First 5
    if ($supabaseResult -match "HTTP") {
        Write-Host "✅ Puedes alcanzar Supabase"
        $supabaseResult | ForEach-Object { Write-Host "   $_" }
    } else {
        Write-Host "❌ No puedes alcanzar Supabase"
        Write-Host "   Verifica que:"
        Write-Host "   1. El emulador tenga Internet"
        Write-Host "   2. Tu firewall no esté bloqueando"
        Write-Host "   3. No estés usando VPN"
    }
} catch {
    Write-Host "❌ Error conectando a Supabase: $_"
}
Write-Host ""

# Test 4: Configuración de red del emulador
Write-Host "4️⃣ Configuración de red del emulador..."
try {
    $speed = adb -s "$emulatorId" shell getprop ro.kernel.qemu.net.speed 2>&1
    $delay = adb -s "$emulatorId" shell getprop ro.kernel.qemu.net.delay 2>&1
    Write-Host "   Velocidad: $speed"
    Write-Host "   Delay: $delay"
} catch {
    Write-Host "   ⚠️ No se pudo obtener configuración de red"
}
Write-Host ""

Write-Host "✅ Diagnóstico completado"
