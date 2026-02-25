import { createClient } from '@supabase/supabase-js';

// Verificar que las variables de entorno estén definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY');
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Función auxiliar para verificar la conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error al conectar con Supabase:', error);
      return { success: false, error };
    }
    
    console.log('✅ Conexión exitosa con Supabase');
    return { success: true, data };
  } catch (err) {
    console.error('Error en la prueba de conexión:', err);
    return { success: false, error: err };
  }
};
