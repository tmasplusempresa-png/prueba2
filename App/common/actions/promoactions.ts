import {
    FETCH_PROMOS,
    FETCH_PROMOS_SUCCESS,
    FETCH_PROMOS_FAILED,
    EDIT_PROMOS,
  } from "../store/types";
  import { getDatabase, ref, onValue, push, set, remove } from "firebase/database";
  
  export const fetchPromos = () => (dispatch) => {
    const database = getDatabase();
    const promoRef = ref(database, "promos");
  
    dispatch({
      type: FETCH_PROMOS,
    });
  
    onValue(
      promoRef,
      (snapshot) => {
        const promos = [];
        snapshot.forEach((childSnapshot) => {
          promos.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
  
        dispatch({
          type: FETCH_PROMOS_SUCCESS,
          payload: promos,
        });
      },
      (error) => {
        dispatch({
          type: FETCH_PROMOS_FAILED,
          payload: error.message,
        });
      }
    );
  };
  
  export const editPromo = (promo, method) => (dispatch) => {
    const database = getDatabase();
    const promoRef = ref(database, `promos/${promo.id}`);
  
    if (method === "Add") {
      push(ref(database, "promos"), promo);
    } else if (method === "Delete") {
      remove(promoRef);
    } else {
      set(promoRef, promo);
    }
  
    dispatch({
      type: EDIT_PROMOS,
      payload: { method, promo },
    });
  };