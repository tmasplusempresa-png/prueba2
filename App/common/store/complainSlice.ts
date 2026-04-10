import { createAsyncThunk } from '@reduxjs/toolkit';
import { ref, set, get, update } from 'firebase/database';
import { database } from "../../config/SupabaseConfig"; // Ajusta la ruta según tu estructura de proyecto

// Acción para agregar una nueva queja
export const addComplain = createAsyncThunk(
  'complains/addComplain',
  async (complainData: any, { rejectWithValue }) => {
    try {
      const complainRef = ref(database, 'complain/' + complainData.id);
      await set(complainRef, complainData);
      return complainData;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Acción para editar una queja existente
export const editComplain = createAsyncThunk(
    'complains/editComplain',
    async (complainData: any, { rejectWithValue }) => {
      try {
        //console.log('editComplain initiated with complainData:', complainData);
        
        const complainRef = ref(database, 'complain/' + complainData.id);
        //console.log('Reference to be updated:', complainRef.toString());
  
        await update(complainRef, complainData);
        //console.log('Complaint successfully updated:', complainData);
  
        return complainData;
      } catch (error) {
        console.error('Error updating complaint:', error);
        return rejectWithValue(error);
      }
    }
  );

// Acción para obtener todas las quejas de un usuario específico
export const fetchComplains = createAsyncThunk(
    'complains/fetchComplains',
    async (userId: string, { rejectWithValue }) => {
      try {
        //console.log('fetchComplains initiated with userId:', userId);
        
        const complainsRef = ref(database, `complain`);
        const snapshot = await get(complainsRef);
  
        //console.log('Firebase snapshot retrieved:', snapshot.exists());
  
        if (snapshot.exists()) {
          const data = snapshot.val();
          //console.log('Data retrieved from Firebase:', data);
  
          const userComplains = Object.values(data).filter(
            (complain: any) => complain.uid === userId
          );
  
          //console.log('Filtered user complaints:', userComplains);
          
          return userComplains;
        } else {
          //console.log('No complaints found for the user.');
          return [];
        }
      } catch (error) {
        console.error('Error fetching complaints:', error);
        return rejectWithValue(error);
      }
    }
  );