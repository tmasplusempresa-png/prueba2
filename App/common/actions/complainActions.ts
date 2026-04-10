// src/redux/actions/complainActions.ts

import { Dispatch } from "redux";
import { database } from "@/config/SupabaseConfig"; // Asegúrate de ajustar la ruta según tu estructura
import { ref, set, push, get, child, query, orderByChild, equalTo } from "firebase/database";
import { ADD_COMPLAIN, GET_COMPLAINS } from "../store/types";
import { getAuth } from "firebase/auth";


export const getComplains = (uid: string) => async (dispatch: Dispatch) => {
    try {
        const auth = getAuth();
        if (!auth.currentUser) {
            console.error("Usuario no autenticado.");
            return;
        }

        if (!uid) {
            console.error("UID es indefinido o nulo");
            return;
        }

        const complainsRef = query(ref(database, 'complains'), orderByChild('uid'), equalTo(uid));
        const snapshot = await get(complainsRef);

        if (snapshot.exists()) {
            const complainsData = Object.values(snapshot.val());
            dispatch({
                type: GET_COMPLAINS,
                payload: complainsData,
            });
        } else {
            dispatch({
                type: GET_COMPLAINS,
                payload: [],
            });
        }
    } catch (error) {
        console.error("Error fetching complains: ", error);
    }
};
// Acción para agregar una nueva queja
export const addComplain = (complain: any) => async (dispatch: Dispatch) => {
    try {
        const newComplainRef = push(ref(database, 'complains'));
        await set(newComplainRef, complain);

        dispatch({
            type: ADD_COMPLAIN,
            payload: {
                ...complain,
                id: newComplainRef.key,
            },
        });
    } catch (error) {
        console.error("Error adding complain: ", error);
    }
};