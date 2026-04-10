import {
    FETCH_BOOKING_LOCATION,
    FETCH_BOOKING_LOCATION_SUCCESS,
    FETCH_BOOKING_LOCATION_FAILED,
    STOP_LOCATION_FETCH,
    STORE_ADRESSES
} from "../store/types";
import { firebase } from '@/config/configureFirebase';
import { query, onValue, set, off, push, limitToLast } from "firebase/database";
import { Dispatch } from "redux";

// Define types for location and bookingId
interface Location {
    lat: number;
    lng: number;
    [key: string]: any; // Additional properties can be added
}

interface BookingLocationAction {
    type: string;
    payload: any;
}

// Save tracking location
export const saveTracking = (bookingId: string, location: Location) => {
    const { trackingRef } = firebase;
    push(trackingRef(bookingId), location);
};

// Fetch booking locations
export const fetchBookingLocations = (bookingId: string) => (dispatch: Dispatch<BookingLocationAction>) => {
    const { trackingRef } = firebase;

    dispatch({
        type: FETCH_BOOKING_LOCATION,
        payload: bookingId,
    });

    onValue(query(trackingRef(bookingId), limitToLast(1)), (snapshot) => {
        if (snapshot.val()) {
            const data = snapshot.val();
            const locations = Object.keys(data).map((i) => data[i]);
            if (locations.length === 1) {
                dispatch({
                    type: FETCH_BOOKING_LOCATION_SUCCESS,
                    payload: locations[0],
                });
            } else {
                dispatch({
                    type: FETCH_BOOKING_LOCATION_FAILED,
                    payload: 'Error de búsqueda de ubicación',
                });
            }
        } else {
            dispatch({
                type: FETCH_BOOKING_LOCATION_FAILED,
                payload: 'Error de búsqueda de ubicación',
            });
        }
    });
};

// Stop location fetch
export const stopLocationFetch = (bookingId: string) => (dispatch: Dispatch<BookingLocationAction>) => {
    const { trackingRef } = firebase;

    dispatch({
        type: STOP_LOCATION_FETCH,
        payload: bookingId,
    });
    off(trackingRef(bookingId));
};

// Save user location
export const saveUserLocation = (location: Location) => {
    const { auth, userLocationRef } = firebase;
    const uid = auth.currentUser?.uid;
    if (uid) {
        set(userLocationRef(uid), location);
    } else {
        console.error("User is not authenticated");
    }
};

// Store addresses
export const storeAddresses = (data: any) => (dispatch: Dispatch<BookingLocationAction>) => {
    dispatch({
        type: STORE_ADRESSES,
        payload: data,
    });
};