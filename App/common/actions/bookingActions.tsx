import {
    CONFIRM_BOOKING,
    CONFIRM_BOOKING_SUCCESS,
    CONFIRM_BOOKING_FAILED,
    CLEAR_BOOKING
} from "../interfaces/actionTypes";
import { sendPushNotification } from '@/common/actions/NotificationService';
import { firebase } from '@/config/configureFirebase';
import { formatBookingObject } from '../other/sharedFunctions';
import { get, onValue, push, set, ref,  } from "firebase/database";


export const saveBooking = async (bookingData: any) => {
    const { database } = firebase;
    //console.log("Received booking data:", bookingData);
  
    // Remove any undefined properties
    const sanitizedBookingData = JSON.parse(JSON.stringify(bookingData));
  
    try {
      const newBookingRef = push(ref(database, 'bookings'));
      //console.log("New booking reference created:", newBookingRef.toString());
  
      await set(newBookingRef, sanitizedBookingData);
      //console.log("Booking data saved successfully at path:", newBookingRef.toString());
  
      return { success: true, key: newBookingRef.key };
    } catch (error) {
      console.error("Error saving booking: ", error);
      return { success: false, error };
    }
  };


  export const updateTrackedBooking = (booking: any) => ({
    type: 'UPDATE_TRACKED_BOOKING',
    payload: booking,
  });
  


export const clearBooking = () => (dispatch) => {
    dispatch({
        type: CLEAR_BOOKING,
        payload: null,
    });
}

export const addBooking = (bookingData: { requestedDrivers: any; }) => async (dispatch: (arg0: { type: string; payload: string | { requestedDrivers: any; } | { booking_id: string | null; mainData: any; }; }) => void) => {
    const {
      bookingRef,
      singleUserRef,
    } = firebase;
  
    dispatch({
      type: CONFIRM_BOOKING,
      payload: bookingData,
    });
  
    let data = await formatBookingObject(bookingData);
  
    if (bookingData.requestedDrivers) {
      const drivers = bookingData.requestedDrivers;
      Object.keys(drivers).map((uid) => {
        onValue(singleUserRef(uid), (snapshot) => {
          if (snapshot.val()) {
            const pushToken = snapshot.val().pushToken;
            if (pushToken) {
              sendPushNotification(
                pushToken,
                {
                  title: 'T+Plus',
                  msg: 'Nueva solicitud de Reserva',
                  screen: 'Map',
                  channelId: 'bookings-repeat',
                }
              );
            }
          }
        }, { onlyOnce: true });
        return drivers[uid];
      });
    }
  
    push(bookingRef, data).then((res) => {
      var bookingKey = res.key;
      dispatch({
        type: CONFIRM_BOOKING_SUCCESS,
        payload: {
          booking_id: bookingKey,
          mainData: {
            ...data,
            id: bookingKey,
          },
        },
      });
    }).catch(error => {
      dispatch({
        type: CONFIRM_BOOKING_FAILED,
        payload: error.code + ": " + error.message,
      });
    });
  };


