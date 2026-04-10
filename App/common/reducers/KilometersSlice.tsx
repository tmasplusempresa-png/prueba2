import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/common/store'; 
import { ref, get, update } from 'firebase/database';
import { database } from '@/config/SupabaseConfig';

// Función para obtener los kilómetros del usuario desde Firebase o inicializarlos si no existen
const apiFetchKilometers = async (uid: string) => {
  try {
    const userRef = ref(database, `users/${uid}/kilometers`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      //console.log(`Kilómetros actuales del usuario ${uid}:`, snapshot.val());
      return snapshot.val(); // Retornamos los kilómetros actuales si existen
    } else {
      console.log(`No se encontraron kilómetros para el usuario ${uid}, inicializando a 500 km.`);
      // Si no existen kilómetros, inicializarlos con 500
      await update(ref(database, `users/${uid}`), { kilometers: 500 });
      return 500; // Retornamos el valor inicializado
    }
  } catch (error) {
    console.error('Error al obtener kilómetros:', error);
    throw error;
  }
};

// Función para actualizar los kilómetros en Firebase
const apiUpdateKilometers = async (uid: string, newKilometers: number) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, { kilometers: newKilometers });
    console.log('Kilómetros actualizados:', newKilometers);
    return newKilometers;
  } catch (error) {
    console.error('Error al actualizar kilómetros:', error);
    throw error;
  }
};

// Acción asíncrona para obtener los kilómetros del usuario
export const fetchKilometers = createAsyncThunk('kilometers/fetchKilometers', async (uid: string) => {
  const kilometers = await apiFetchKilometers(uid);
  return kilometers;
});

// Acción asíncrona para agregar kilómetros al usuario
export const addKilometers = createAsyncThunk('kilometers/addKilometers', async ({ uid, kilometersToAdd }: { uid: string, kilometersToAdd: number }) => {
  const currentKilometers = await apiFetchKilometers(uid);
  const updatedKilometers = currentKilometers + kilometersToAdd;
  const newKilometers = await apiUpdateKilometers(uid, updatedKilometers);
  return newKilometers;
});

// Estado inicial
interface KilometersState {
  kilometers: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: KilometersState = {
  kilometers: null,
  loading: false,
  error: null,
};

// Slice para manejar las acciones de kilómetros
const kilometersSlice = createSlice({
  name: 'kilometers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Para obtener los kilómetros
      .addCase(fetchKilometers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKilometers.fulfilled, (state, action) => {
        state.loading = false;
        state.kilometers = action.payload;
      })
      .addCase(fetchKilometers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al obtener los kilómetros';
      })

      // Para agregar kilómetros
      .addCase(addKilometers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addKilometers.fulfilled, (state, action) => {
        state.loading = false;
        state.kilometers = action.payload; // Actualizamos los kilómetros con el valor actualizado
      })
      .addCase(addKilometers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al agregar kilómetros';
      });
  },
});

// Selector para obtener los kilómetros actuales
export const selectKilometers = (state: RootState) => state.kilometers.kilometers;

// Selector para el estado de carga
export const selectKilometersLoading = (state: RootState) => state.kilometers.loading;

export default kilometersSlice.reducer;