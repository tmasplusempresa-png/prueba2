import { createAsyncThunk } from '@reduxjs/toolkit';
import { SUPABASE_URL, SUPABASE_ANON_KEY, getSupabaseAuthHeaders } from '../../config/SupabaseConfig';

// Acción para agregar una nueva queja usando Supabase REST API
export const addComplain = createAsyncThunk(
  'complains/addComplain',
  async (complainData: any, { rejectWithValue }) => {
    try {
      // Obtener headers de autenticación
      const headers = await getSupabaseAuthHeaders(true);

      // Primero obtener el user_id real de la tabla users usando auth_id
      const userQueryUrl = `${SUPABASE_URL}/rest/v1/users?auth_id=eq.${encodeURIComponent(complainData.uid)}&select=id&limit=1`;
      const userResponse = await fetch(userQueryUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        throw new Error('No se pudo obtener el ID del usuario');
      }

      const userData = await userResponse.json();
      if (!userData || userData.length === 0) {
        throw new Error('Usuario no encontrado en la base de datos');
      }

      const userId = userData[0].id;

      // Preparar datos para insertar en complaints
      const complaintPayload = {
        user_id: userId,
        complaint_type: complainData.complaintType,
        subject: complainData.subject,
        body: complainData.body,
        priority: complainData.priority,
        evidence_urls: complainData.evidenceUrls || [],
        status: 'pending',
        // user_type se actualiza automáticamente por trigger, pero lo incluimos por si acaso
        user_type: complainData.role || 'customer',
      };

      // Insertar queja en Supabase
      const insertUrl = `${SUPABASE_URL}/rest/v1/complaints`;
      const insertResponse = await fetch(insertUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(complaintPayload),
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        console.error('Error insertando queja:', errorText);
        throw new Error(`Error al guardar la queja: ${insertResponse.status}`);
      }

      const insertedData = await insertResponse.json();
      const insertedComplaint = Array.isArray(insertedData) ? insertedData[0] : insertedData;

      // Retornar datos compatibles con el formato anterior para mantener compatibilidad con UI
      return {
        ...complainData,
        id: insertedComplaint.id,
        status: insertedComplaint.status,
        created_at: insertedComplaint.created_at,
      };
    } catch (error: any) {
      console.error('Error en addComplain:', error);
      return rejectWithValue(error.message || 'Error al guardar la queja');
    }
  }
);

// Acción para editar una queja existente (si es necesario)
export const editComplain = createAsyncThunk(
  'complains/editComplain',
  async (complainData: any, { rejectWithValue }) => {
    try {
      const headers = await getSupabaseAuthHeaders(true);

      // Preparar datos para actualizar
      const updatePayload = {
        complaint_type: complainData.complaintType,
        subject: complainData.subject,
        body: complainData.body,
        priority: complainData.priority,
        evidence_urls: complainData.evidenceUrls || [],
      };

      const updateUrl = `${SUPABASE_URL}/rest/v1/complaints?id=eq.${encodeURIComponent(complainData.id)}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Error actualizando queja:', errorText);
        throw new Error(`Error al actualizar la queja: ${updateResponse.status}`);
      }

      const updatedData = await updateResponse.json();
      const updatedComplaint = Array.isArray(updatedData) ? updatedData[0] : updatedData;

      return {
        ...complainData,
        updated_at: updatedComplaint.updated_at,
      };
    } catch (error: any) {
      console.error('Error en editComplain:', error);
      return rejectWithValue(error.message || 'Error al actualizar la queja');
    }
  }
);

// Acción para obtener todas las quejas de un usuario específico
export const fetchComplains = createAsyncThunk(
  'complains/fetchComplains',
  async (userId: string, { rejectWithValue }) => {
    try {
      const headers = await getSupabaseAuthHeaders();

      // Primero obtener el user_id real de la tabla users usando auth_id
      const userQueryUrl = `${SUPABASE_URL}/rest/v1/users?auth_id=eq.${encodeURIComponent(userId)}&select=id&limit=1`;
      const userResponse = await fetch(userQueryUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        console.warn('No se pudo obtener el ID del usuario para quejas');
        return [];
      }

      const userData = await userResponse.json();
      if (!userData || userData.length === 0) {
        console.warn('Usuario no encontrado para obtener quejas');
        return [];
      }

      const realUserId = userData[0].id;

      // Obtener quejas del usuario
      const complaintsUrl = `${SUPABASE_URL}/rest/v1/complaints?user_id=eq.${encodeURIComponent(realUserId)}&order=created_at.desc`;
      const complaintsResponse = await fetch(complaintsUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });

      if (!complaintsResponse.ok) {
        console.warn('Error obteniendo quejas:', complaintsResponse.status);
        return [];
      }

      const complaintsData = await complaintsResponse.json();

      // Mapear datos de Supabase al formato esperado por la UI
      const mappedComplaints = complaintsData.map((complaint: any) => ({
        id: complaint.id,
        subject: complaint.subject,
        body: complaint.body,
        complaintType: complaint.complaint_type,
        priority: complaint.priority,
        uid: userId, // Mantener el auth_id para compatibilidad
        complainDate: new Date(complaint.created_at).getTime(),
        evidenceUrls: complaint.evidence_urls || [],
        status: complaint.status,
        admin_response: complaint.admin_response,
        user_type: complaint.user_type, // Agregar tipo de usuario
        created_at: complaint.created_at,
        updated_at: complaint.updated_at,
        // Campos legacy que ya no se usan pero se mantienen por compatibilidad
        check: false,
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        role: complaint.user_type, // Mapear role al user_type
      }));

      return mappedComplaints;
    } catch (error: any) {
      console.error('Error en fetchComplains:', error);
      return rejectWithValue(error.message || 'Error al obtener las quejas');
    }
  }
);