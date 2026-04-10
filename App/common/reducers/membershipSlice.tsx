import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/common/store";
import { format, addDays } from "date-fns";
import {
  ref,
  get,
  query,
  equalTo,
  orderByChild,
  set,
  update,
} from "firebase/database";
import { database } from "@/config/SupabaseConfig";
import { supabase } from "@/config/SupabaseConfig";
import { getMemberships } from "@/common/services/membershipsService";

// Función para generar un UID aleatorio similar a los de Firebase
const generateUID = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let uid = "-";
  for (let i = 0; i < 20; i++) {
    uid += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return uid;
};

// Función para obtener las membresías filtradas por el uid del conductor desde Supabase
const apiFetchMemberships = async (uid: string) => {
  console.log("🔍 [API] Iniciando fetch de membresías para UID:", uid);
  
  if (!uid || uid.length === 0) {
    console.error("❌ UID vacío o inválido:", uid);
    return [];
  }

  try {
    // 🌐 USAR SERVICIO REST QUE NO TIENE PROBLEMAS DE RLS
    const data = await getMemberships(uid);
    
    console.log(`✅ [API] Membresías obtenidas: ${data.length}`);
    return data;
  } catch (error) {
    console.error("❌ Error en apiFetchMemberships:", error);
    return [];
  }
};

// Función para cancelar membresía en Supabase por su `uid`
const apiCancelMembership = async (membershipUid: string) => {
  try {
    console.log("🔄 Cancelando membresía con UID:", membershipUid);
    
    const { error } = await supabase
      .from('memberships')
      .update({ status: 'CANCELADA' })
      .eq('uid', membershipUid);

    if (error) {
      throw error;
    }

    console.log("✅ Membresía cancelada:", membershipUid);
    return { uid: membershipUid, status: "CANCELADA" };
  } catch (error) {
    console.error("❌ Error al cancelar la membresía:", error);
    throw new Error("Error al cancelar la membresía");
  }
};

// Función para crear una nueva membresía en Supabase
const apiCreateMembership = async (membershipData: any) => {
  try {
    console.log("➕ Creando nueva membresía con datos:", membershipData);
    
    const { data, error } = await supabase
      .from('memberships')
      .insert([membershipData])
      .select();

    if (error) {
      throw error;
    }

    console.log("✅ Membresía creada con éxito:", data);
    return data?.[0] || membershipData;
  } catch (error) {
    console.error("❌ Error al crear la nueva membresía:", error);
    throw new Error("Error al crear la nueva membresía");
  }
};

// Acción asíncrona para obtener las membresías del conductor autenticado
export const fetchMemberships = createAsyncThunk(
  "Memberships/fetchMemberships",
  async (uid: string) => {
    const response = await apiFetchMemberships(uid);
   // console.log("fetchMemberships completado, respuesta:", response);
    return response;
  }
);

// Acción asíncrona para renovar la membresía
export const renewMembership = createAsyncThunk(
  "Memberships/renewMembership",
  async (conductor: string) => {
   // console.log("Renovando membresía para el conductor:", conductor);

    const activeMembership = await apiFetchMemberships(conductor);
    const activeMembershipUid = activeMembership.find(
      (m: any) => m.status === "ACTIVA"
    )?.uid;

    // Si hay una membresía activa, cancelarla antes de crear una nueva
    if (activeMembershipUid) {
      console.log(
        "Cancelando membresía activa antes de renovar. UID:",
        activeMembershipUid
      );
      await apiCancelMembership(activeMembershipUid);
    }

    // Crear nueva membresía
    const startDate = new Date();
    const endDate = addDays(startDate, 30);

    const newMembershipData = {
      conductor: conductor,
      status: "ACTIVA",
      fecha_inicio: format(startDate, "yyyy-MM-dd"),
      fecha_terminada: format(endDate, "yyyy-MM-dd"),
      periodo: 30,
      costo: 157200,
      uid: generateUID(),
    };

    console.log("Creando nueva membresía con datos:", newMembershipData);
    const response = await apiCreateMembership(newMembershipData);
    console.log("Nueva membresía creada:", response);
    return response;
  }
);

// Acción asíncrona para cancelar la membresía
export const cancelMembership = createAsyncThunk(
  "Memberships/cancelMembership",
  async (membershipUid: string) => {
    console.log("cancelMembership llamado para UID:", membershipUid);
    const response = await apiCancelMembership(membershipUid);
    console.log("cancelMembership completado, respuesta:", response);
    return response;
  }
);

// Acción asíncrona para crear una nueva membresía (separada de la renovación)
export const createMembership = createAsyncThunk(
  "Memberships/createMembership",
  async (membershipData: { uid: string; costo: string }) => {
    console.log("Creando nueva membresía para el conductor:", membershipData.uid, membershipData.costo);

    const startDate = new Date();
    const endDate = addDays(startDate, 30);

    const newMembershipData = {
      conductor: membershipData.uid,
      status: "ACTIVA",
      fecha_inicio: format(startDate, "yyyy-MM-dd"),
      fecha_terminada: format(endDate, "yyyy-MM-dd"),
      periodo: 30,
      costo: membershipData.costo,
      uid: generateUID(),
    };

    console.log("Creando nueva membresía con datos:", newMembershipData);
    const response = await apiCreateMembership(newMembershipData);
    console.log("Nueva membresía creada:", response);
    return response;
  }
);

// Estado inicial del slice
interface MembershipState {
  memberships: any[];
  loading: boolean;
  error: string | null;
}

const initialState: MembershipState = {
  memberships: [],
  loading: false,
  error: null,
};

const membershipSlice = createSlice({
  name: "memberships",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetching memberships
      .addCase(fetchMemberships.pending, (state) => {
      //  console.log("fetchMemberships.pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberships.fulfilled, (state, action) => {
       // console.log("fetchMemberships.fulfilled", action.payload);
        state.loading = false;
        state.memberships = action.payload;
      })
      .addCase(fetchMemberships.rejected, (state, action) => {
       // console.log("fetchMemberships.rejected", action.error.message);
        state.loading = false;
        state.error = action.error.message || "Error al obtener las membresías";
      })

      // Renew membership
      .addCase(renewMembership.pending, (state) => {
      //  console.log("renewMembership.pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(renewMembership.fulfilled, (state, action) => {
     //   console.log("renewMembership.fulfilled", action.payload);
        state.loading = false;
        const updatedMembership = action.payload;
        state.memberships.push(updatedMembership);
      })
      .addCase(renewMembership.rejected, (state, action) => {
        //console.log("renewMembership.rejected", action.error.message);
        state.loading = false;
        state.error = action.error.message || "Error al renovar la membresía";
      })

      // Cancel membership
      .addCase(cancelMembership.pending, (state) => {
     //   console.log("cancelMembership.pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelMembership.fulfilled, (state, action) => {
     //   console.log("cancelMembership.fulfilled", action.payload);
        state.loading = false;
        const { uid, status } = action.payload;
        state.memberships = state.memberships.map((membership) =>
          membership.uid === uid ? { ...membership, status } : membership
        );
      })
      .addCase(cancelMembership.rejected, (state, action) => {
      //  console.log("cancelMembership.rejected", action.error.message);
        state.loading = false;
        state.error = action.error.message || "Error al cancelar la membresía";
      })

      // Create membership
      .addCase(createMembership.pending, (state) => {
      //  console.log("createMembership.pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(createMembership.fulfilled, (state, action) => {
       // console.log("createMembership.fulfilled", action.payload);
        state.loading = false;
        state.memberships.push(action.payload);
      })
      .addCase(createMembership.rejected, (state, action) => {
     //   console.log("createMembership.rejected", action.error.message);
        state.loading = false;
        state.error = action.error.message || "Error al crear la membresía";
      });
  },
});

// Selector para obtener las membresías activas del conductor autenticado
export const selectActiveMemberships = (state: RootState, uid: string) =>
  state.memberships.memberships.filter(
    (membership) =>
      membership.status === "ACTIVA" && membership.conductor === uid
  );

// Selector para el estado de carga
export const selectMembershipLoading = (state: RootState) =>
  state.memberships.loading;

export default membershipSlice.reducer;
