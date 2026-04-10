// actionTypes.ts
export const SET_USER = 'SET_USER';
export const CLEAR_USER = 'CLEAR_USER';
export const CONFIRM_BOOKING = "CONFIRM_BOOKING";
export const CONFIRM_BOOKING_SUCCESS = "CONFIRM_BOOKING_SUCCESS";
export const CONFIRM_BOOKING_FAILED = "CONFIRM_BOOKING_FAILED";
export const CLEAR_BOOKING = "CLEAR_BOOKING";
// common/types/types.ts

export const FETCH_USER = 'FETCH_USER';
export const FETCH_USER_SUCCESS = 'FETCH_USER_SUCCESS';
export const FETCH_USER_FAILED = 'FETCH_USER_FAILED';
export const USER_SIGN_IN = 'USER_SIGN_IN';
export const USER_SIGN_IN_FAILED = 'USER_SIGN_IN_FAILED';
export const USER_SIGN_OUT = 'USER_SIGN_OUT';
export const CLEAR_LOGIN_ERROR = 'CLEAR_LOGIN_ERROR';

export const UPDATE_USER_WALLET_HISTORY = 'UPDATE_USER_WALLET_HISTORY';
export const SEND_RESET_EMAIL = 'SEND_RESET_EMAIL';
export const SEND_RESET_EMAIL_FAILED = 'SEND_RESET_EMAIL_FAILED';


export const UPDATE_GPS_LOCATION = 'UPDATE_GPS_LOCATION';
export const STORE_ADRESSES = 'STORE_ADRESSES';
export const FETCH_BOOKING_LOCATION = 'FETCH_BOOKING_LOCATION';
export const FETCH_BOOKING_LOCATION_SUCCESS = 'FETCH_BOOKING_LOCATION_SUCCESS';
export const FETCH_BOOKING_LOCATION_FAILED = 'FETCH_BOOKING_LOCATION_FAILED';
export const STOP_LOCATION_FETCH = 'STOP_LOCATION_FETCH';

export const FETCH_SETTINGS = "FETCH_SETTINGS";
export const FETCH_SETTINGS_SUCCESS = "FETCH_SETTINGS_SUCCESS";
export const FETCH_SETTINGS_FAILED = "FETCH_SETTINGS_FAILED";
export const EDIT_SETTINGS = "EDIT_SETTINGS";
export const CLEAR_SETTINGS_ERROR = "CLEAR_SETTINGS_ERROR";

export interface Action {
    type: string;
    payload?: any;
  }
  
  export interface State {
    settings?: any;
    user?: any;
    location?: any;
    gpsdata?: any;
    bookinglistdata?: {
      tracked?: any;
    };
    locationdata?: {
      coords?: any;
    };
    auth?: {
      profile?: any;
      pushToken?: any;
      error?: any;
    };
    languagedata?: {
      langlist?: any;
    };
    taskdata?: {
      tasks?: any;
    };
    error?: {
      flag: boolean;
      msg: string;
    };
    loading?: boolean;
    booking?: any;
    addresses?: any;
  }