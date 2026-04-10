// ESTE TEST HA SIDO CREADO PARA VERIFICAR LA CONEXION A SUPABASE SIN DEPENDENCIAS DE REACT NATIVE
// HA SIDO CREADO CON IA, 
// NO ES UN TEST COMPLETO, SOLO ES UN TEST PARA VERIFICAR LA CONEXION A SUPABASE

// Test simple de Supabase sin dependencias de React Native
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno desde .env
require('dotenv').config();

// Configuración básica
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('=== TEST SIMPLE DE SUPABASE ===\n');
console.log('Variables de entorno cargadas:');
console.log('  SUPABASE_URL desde .env:', process.env.SUPABASE_URL ? '✅ SI' : '❌ NO');
console.log('  SUPABASE_ANON_KEY desde .env:', process.env.SUPABASE_ANON_KEY ? '✅ SI' : '❌ NO');
console.log('');

async function testSupabase() {
  try {
    // Crear cliente de Supabase
    console.log('1. Creando cliente de Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('   ✅ Cliente creado exitosamente');

    // Test de conexión básica
    console.log('\n2. Probando conexión...');
    console.log('   URL:', supabaseUrl);
    console.log('   Key (primeros 20 chars):', supabaseKey.substring(0, 20) + '...');
    
    // Probar con una consulta simple que siempre funciona
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      // Este "error" es normal cuando no hay sesión activa
      if (error.message === 'Auth session missing!') {
        console.log('   ✅ Conexión exitosa (sin sesión activa)');
        console.log('   Estado: Usuario no autenticado (normal)');
      } else {
        console.log('   ❌ Error real de conexión:', error.message);
        console.log('   Código de error:', error.code);
      }
    } else {
      console.log('   ✅ Conexión exitosa');
      console.log('   Usuario actual:', data.user ? 'Autenticado' : 'No autenticado');
    }

    // Test de autenticación
    console.log('\n3. Probando autenticación...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('   ❌ Error de auth:', authError.message);
    } else {
      console.log('   ✅ Auth funcionando');
      console.log('   Sesión actual:', authData.session ? 'Activa' : 'Inactiva');
    }

  } catch (error) {
    console.log('❌ Error crítico:', error.message);
  }
}

// Ejecutar test
testSupabase();
