import { supabase } from '@/config/SupabaseConfig';

/**
 * Test directo del RPC sin Redux
 * Ejecuta esto desde un botón o en un console.log para diagnosticar
 */
export const testRPCMemberships = async (uid: string) => {
  console.log('🧪 [TEST RPC] Iniciando test con UID:', uid);
  
  try {
    const startTime = Date.now();
    console.log('📡 Llamando RPC...');
    
    const { data, error, status } = await supabase.rpc('get_my_memberships', {
      conductor_id: uid
    });

    const duration = Date.now() - startTime;
    
    console.log('✅ RPC completado en', duration, 'ms');
    console.log('State:', status);
    console.log('Error:', error);
    console.log('Data:', data);
    
    return { data, error, duration };
  } catch (ex) {
    console.error('❌ Exception:', ex);
    return { data: null, error: ex };
  }
};

/**
 * Test de lectura directa sin RPC
 */
export const testDirectRead = async (uid: string) => {
  console.log('🧪 [TEST DIRECT] Leyendo datos directamente con UID:', uid);
  
  try {
    const startTime = Date.now();
    console.log('📡 Consultando memberships...');
    
    const { data, error, status } = await supabase
      .from('memberships')
      .select('*')
      .eq('conductor', uid)
      .order('created_at', { ascending: false });

    const duration = Date.now() - startTime;
    
    console.log('✅ Lectura completada en', duration, 'ms');
    console.log('State:', status);
    console.log('Error:', error);
    console.log('Data:', data);
    
    return { data, error, duration };
  } catch (ex) {
    console.error('❌ Exception:', ex);
    return { data: null, error: ex };
  }
};

/**
 * Test de autenticación
 */
export const testAuth = async () => {
  console.log('🧪 [TEST AUTH] Verificando autenticación...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('✅ Usuario:', user?.id);
    console.log('Error:', error);
    return user;
  } catch (ex) {
    console.error('❌ Exception:', ex);
    return null;
  }
};
