import {
    FETCH_PROMOS,
    FETCH_PROMOS_SUCCESS,
    FETCH_PROMOS_FAILED,
    EDIT_PROMOS,
  } from "../store/types";
  
  const initialState = {
    promos: [],
    loading: false,
    error: null,
  };
  
  const promosReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_PROMOS:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case FETCH_PROMOS_SUCCESS:
        return {
          ...state,
          loading: false,
          promos: action.payload,
        };
      case FETCH_PROMOS_FAILED:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case EDIT_PROMOS:
        const updatedPromos = state.promos.map((promo) =>
          promo.id === action.payload.promo.id
            ? { ...promo, ...action.payload.promo }
            : promo
        );
        return {
          ...state,
          promos: updatedPromos,
        };
      default:
        return state;
    }
  };
  
  export default promosReducer;