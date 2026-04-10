import { Health } from './config/SupabaseConfig';
import { validateConfiguration } from './config/AppConfig';

async function testSupabaseConnection() {
  console.log('=== INICIANDO TEST DE CONEXION SUPABASE ===\n');

  // 1. Validar configuración
  console.log('1. VALIDANDO CONFIGURACION...');
  const config = validateConfiguration();
  console.log(`   Configuración válida: ${config.isValid ? '✅ SI' : '❌ NO'}`);
  
  if (!config.isValid) {
    console.log('   Errores encontrados:');
    config.errors.forEach(error => console.log(`   - ${error}`));
    return;
  }

  // 2. Test de conexión
  console.log('\n2. PROBANDO CONEXION A SUPABASE...');
  try {
    const connectionResult = await Health.testConnection();
    
    if (connectionResult.isConnected) {
      console.log('   Conexión: ✅ EXITOSA');
      console.log(`   Verificado el: ${connectionResult.lastChecked}`);
    } else {
      console.log('   Conexión: ❌ FALLIDA');
      console.log(`   Error: ${connectionResult.error}`);
    }
  } catch (error) {
    console.log('   Conexión: ❌ ERROR CRITICO');
    console.log(`   Detalle: ${error}`);
  }

  // 3. Test de salud de base de datos
  console.log('\n3. VALIDANDO SALUD DE BASE DE DATOS...');
  try {
    const dbHealth = await Health.checkDatabaseHealth();
    console.log(`   Tablas accesibles: ${dbHealth.tablesCount}/4`);
    console.log(`   Base de datos saludable: ${dbHealth.isHealthy ? '✅ SI' : '❌ NO'}`);
  } catch (error) {
    console.log('   Test de BD: ❌ ERROR');
    console.log(`   Detalle: ${error}`);
  }

  console.log('\n=== TEST COMPLETADO ===');
}

// Ejecutar test
testSupabaseConnection();
