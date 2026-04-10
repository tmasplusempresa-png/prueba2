// common/reducers/reducers.ts

import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './authReducer';
import walletReducer from './walletSlice';
import promosReducer from "./promosReducer";

import {
  FETCH_SETTINGS,
  FETCH_SETTINGS_SUCCESS,
  FETCH_SETTINGS_FAILED,
  EDIT_SETTINGS,
  CLEAR_SETTINGS_ERROR,
  FETCH_BOOKING_LOCATION,
  FETCH_BOOKING_LOCATION_SUCCESS,
  FETCH_BOOKING_LOCATION_FAILED,
  STOP_LOCATION_FETCH,
  STORE_ADRESSES,
  UPDATE_GPS_LOCATION,
  CONFIRM_BOOKING,
  CONFIRM_BOOKING_SUCCESS,
  CONFIRM_BOOKING_FAILED,
  CLEAR_BOOKING,
} from '../interfaces/actionTypes';

const INITIAL_STATE = {
  settings: {},
  user: null,
  location: {},
  gpsdata: {
    location: null,
    error: false,
  },
  bookinglistdata: {
    tracked: null,
  },
  locationdata: {
    coords: null,
  },
  languagedata: {
    langlist: [],
  },
  taskdata: {
    tasks: [],
  },
};

export const settingsReducer = (state = INITIAL_STATE.settings, action: any) => {
  switch (action.type) {
    case FETCH_SETTINGS:
      return {
        ...state,
        loading: true,
      };
    case FETCH_SETTINGS_SUCCESS:
      return {
        ...state,
        settings: action.payload,
        loading: false,
      };
    case FETCH_SETTINGS_FAILED:
      return {
        ...state,
        settings: null,
        loading: false,
        error: {
          flag: true,
          msg: action.payload,
        },
      };
    case EDIT_SETTINGS:
      return state;
    case CLEAR_SETTINGS_ERROR:
      return {
        ...state,
        error: {
          flag: false,
          msg: null,
        },
      };
    default:
      return state;
  }
};

export const locationReducer = (state = INITIAL_STATE.locationdata, action: any) => {
  switch (action.type) {
    case FETCH_BOOKING_LOCATION:
      return {
        ...state,
        loading: true,
      };
    case FETCH_BOOKING_LOCATION_SUCCESS:
      return {
        ...state,
        coords: action.payload,
        loading: false,
      };
    case FETCH_BOOKING_LOCATION_FAILED:
      return {
        ...state,
        loading: false,
        error: {
          flag: true,
          msg: action.payload,
        },
      };
    case STORE_ADRESSES:
      return {
        ...state,
        addresses: action.payload,
      };
    case STOP_LOCATION_FETCH:
      return INITIAL_STATE.locationdata;
    default:
      return state;
  }
};

export const gpsReducer = (state = INITIAL_STATE.gpsdata, action: any) => {
  switch (action.type) {
    case UPDATE_GPS_LOCATION:
      return {
        ...state,
        location: action.payload && action.payload.lat ? action.payload : null,
        error: action.payload && action.payload.lat ? false : true,
      };
    default:
      return state;
  }
};

export const bookingReducer = (state = INITIAL_STATE.bookinglistdata, action: any) => {
  switch (action.type) {
    case CONFIRM_BOOKING:
      return {
        ...state,
        loading: true,
      };
    case CONFIRM_BOOKING_SUCCESS:
      return {
        ...state,
        booking: action.payload,
        loading: false,
      };
    case CONFIRM_BOOKING_FAILED:
      return {
        ...state,
        booking: null,
        active: action.payload.active,
        loading: false,
        error: {
          flag: true,
          msg: action.payload,
        },
      };
    case 'UPDATE_TRACKED_BOOKING':
      return {
        ...state,
        tracked: action.payload,
      };
    case CLEAR_BOOKING:
      return INITIAL_STATE.bookinglistdata;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  settings: settingsReducer,
  locationdata: locationReducer,
  gpsdata: gpsReducer,
  bookinglistdata: bookingReducer,
  auth: authReducer,
  wallet: walletReducer,
  promodata: promosReducer,

  // Add other reducers here as needed
});

export default rootReducer;