import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

console.log('🔍 Iniciando prueba de conexión a Supabase...\n');

// Obtener variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Verificar variables de entorno
console.log('Variables de entorno:');
console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ No definida');
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Definida' : '❌ No definida');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan variables de entorno. Verifica que el archivo .env existe y tiene las variables correctas.');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Probar diferentes operaciones con la base de datos
async function runTests() {
  console.log('📊 Probando conexión a la base de datos...\n');

  // Test 1: Verificar conexión básica
  try {
    console.log('Test 1: Verificando conexión básica...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Error en conexión básica:', error.message);
    } else {
      console.log('✅ Conexión básica exitosa');
    }
  } catch (err: any) {
    console.log('❌ Excepción en conexión básica:', err.message);
  }

  // Test 2: Listar primeros usuarios
  try {
    console.log('\nTest 2: Obteniendo primeros 5 usuarios...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Error al obtener usuarios:', error.message);
    } else {
      console.log(`✅ Se obtuvieron ${data?.length || 0} usuarios`);
      if (data && data.length > 0) {
        console.log('Ejemplo de usuario:', data[0]);
      }
    }
  } catch (err: any) {
    console.log('❌ Excepción al obtener usuarios:', err.message);
  }

  // Test 3: Verificar tabla de reservas (bookings)
  try {
    console.log('\nTest 3: Verificando tabla de reservas...');
    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Error al acceder a reservas:', error.message);
    } else {
      console.log(`✅ Tabla de reservas accesible (${count} registros)`);
    }
  } catch (err: any) {
    console.log('❌ Excepción al acceder a reservas:', err.message);
  }

  // Test 4: Verificar tabla de vehículos (cars)
  try {
    console.log('\nTest 4: Verificando tabla de vehículos...');
    const { count, error } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Error al acceder a vehículos:', error.message);
    } else {
      console.log(`✅ Tabla de vehículos accesible (${count} registros)`);
    }
  } catch (err: any) {
    console.log('❌ Excepción al acceder a vehículos:', err.message);
  }

  console.log('\n✅ Pruebas completadas');
}

runTests().catch(console.error);
