import { createAsyncThunk } from "@reduxjs/toolkit";
import { FETCH_PROMOS, FETCH_PROMOS_SUCCESS, FETCH_PROMOS_FAILED, EDIT_PROMOS } from "../store/types";
import { database } from "../../config/SupabaseConfig"; // Ajusta la ruta según tu estructura de proyecto
import { onValue, push, set, remove, ref,  } from "firebase/database";

// Acción para obtener promociones
export const fetchPromos = createAsyncThunk("promos/fetchPromos", async (_, { rejectWithValue }) => {
  const promoRef = ref(database, "promos");

  try {
    return new Promise((resolve) => {
      onValue(promoRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const promosArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          resolve(promosArray);
        } else {
          resolve([]);
        }
      });
    });
  } catch (error) {
    return rejectWithValue(error.message || "Error fetching promotions.");
  }
});

// Acción para editar promociones
export const editPromo = createAsyncThunk(
  "promos/editPromo",
  async ({ promo, method }, { rejectWithValue }) => {
    const promoRef = ref(database, `promos/${promo.id || ""}`);

    try {
      if (method === "Add") {
        const newPromoRef = await push(ref(database, "promos"), promo);
        promo.id = newPromoRef.key; // Establece la nueva clave generada en el objeto promo
      } else if (method === "Delete") {
        await remove(promoRef);
      } else if (method === "Update") {
        await set(promoRef, promo);
      }
      return { promo, method };
    } catch (error) {
      return rejectWithValue(error.message || "Error editing promotion.");
    }
  }
);