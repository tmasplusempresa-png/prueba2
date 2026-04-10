// Test simple de conexión a Supabase
// Ejecutar con: npx ts-node test-supabase-connection.ts

import supabase from './config/SupabaseConfig';

async function testConnection() {
  console.log('🧪 Iniciando test de conexión a Supabase...\n');

  try {
    // Test 1: Verificar configuración
    console.log('1️⃣ Verificando configuración Supabase...');
    const supabaseUrl = (supabase as any).supabaseUrl;
    console.log('   URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada');
    console.log('');

    // Test 2: Query simple a tabla users
    console.log('2️⃣ Probando query a tabla users...');
    const startTime = Date.now();
    const { data: usersData, error: usersError, count } = await supabase
      .from('users')
      .select('email', { count: 'exact' })
      .limit(1);
    const queryTime = Date.now() - startTime;

    if (usersError) {
      console.log('   ❌ Error:', usersError.message);
    } else {
      console.log(`   ✅ Query exitosa (${queryTime}ms)`);
      console.log(`   Total registros en la tabla: ${count}`);
    }
    console.log('');

    // Test 3: Verificar email específico
    console.log('3️⃣ Probando búsqueda de email...');
    const testEmail = 'andresfelipecristancho2014@gmail.com';
    const startTime2 = Date.now();
    const { data: emailData, error: emailError, count: emailCount } = await supabase
      .from('users')
      .select('email', { count: 'exact' })
      .ilike('email', testEmail);
    const queryTime2 = Date.now() - startTime2;

    if (emailError) {
      console.log('   ❌ Error:', emailError.message);
    } else {
      console.log(`   ✅ Query exitosa (${queryTime2}ms)`);
      console.log(`   Email "${testEmail}" existe: ${(emailCount ?? 0) > 0 ? 'SÍ' : 'NO'}`);
      console.log(`   Coincidencias encontradas: ${emailCount ?? 0}`);
    }
    console.log('');

    // Test 4: Verificar RPC function
    console.log('4️⃣ Probando RPC check_email_exists...');
    const startTime3 = Date.now();
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('check_email_exists', {
        check_email: testEmail,
      } as any);
      const queryTime3 = Date.now() - startTime3;

      if (rpcError) {
        console.log('   ⚠️ RPC no disponible:', rpcError.message);
      } else {
        console.log(`   ✅ RPC disponible (${queryTime3}ms)`);
        console.log(`   Resultado: ${rpcData}`);
      }
    } catch (e: any) {
      console.log('   ❌ Error al ejecutar RPC:', e.message);
    }
    console.log('');

    // Test 5: Verificar teléfono
    console.log('5️⃣ Probando búsqueda de teléfono...');
    const testPhone = '+13133752565';
    const startTime4 = Date.now();
    const { data: phoneData, error: phoneError, count: phoneCount } = await supabase
      .from('users')
      .select('mobile', { count: 'exact' })
      .in('mobile', [testPhone, '3133752565']);
    const queryTime4 = Date.now() - startTime4;

    if (phoneError) {
      console.log('   ❌ Error:', phoneError.message);
    } else {
      console.log(`   ✅ Query exitosa (${queryTime4}ms)`);
      console.log(`   Teléfono "${testPhone}" existe: ${(phoneCount ?? 0) > 0 ? 'SÍ' : 'NO'}`);
      console.log(`   Coincidencias encontradas: ${phoneCount ?? 0}`);
    }
    console.log('');

    console.log('✅ Test completado\n');
  } catch (error: any) {
    console.error('❌ Error general:', error.message);
  }
}

testConnection();
