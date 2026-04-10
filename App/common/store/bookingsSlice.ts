import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { database } from "../../config/SupabaseConfig"; // Ajusta la ruta según tu estructura de proyecto
import {
  ref,
  push,
  update,
  get,
  query,
  orderByChild,
  equalTo,
  onValue,
  limitToLast,
} from "firebase/database";
import axios from "axios";
//import { Audio } from "expo-av";
import { AppDispatch, RootState } from "./store";
import { addActualsToBooking } from "../other/sharedFunctions";

interface Booking {
  id: string;
  uid_customer: string;
  status: string;
  [key: string]: any;
}

interface BookingsState {
  bookings: Booking[];
  recentDrivers: any[];
  newBooking: Booking | null;
  modalOpen: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: BookingsState = {
  bookings: [],
  recentDrivers: [],
  newBooking: null,
  modalOpen: false,
  loading: false,
  error: null,
};


const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    fetchBookingsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchBookingsSuccess(state, action: PayloadAction<Booking[]>) {
      state.loading = false;
      const newBookings = action.payload.filter(
        (newBooking) =>
          !state.bookings.some(
            (existingBooking) => existingBooking.id === newBooking.id
          )
      );
      state.bookings = [...state.bookings, ...newBookings];
    },
    fetchBookingsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    updateBookingStart(state) {
      state.loading = true;
      state.error = null;
    },
    updateBookingSuccess(state, action: PayloadAction<Booking>) {
      state.loading = false;
      const index = state.bookings.findIndex(
        (booking) => booking.id === action.payload.id
      );
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
    },
    updateBookingFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    setNewBooking(state, action: PayloadAction<Booking | null>) {
      state.newBooking = action.payload;
      state.modalOpen = !!action.payload;
    },
    closeModal(state) {
      state.modalOpen = false;
    },
    removeBooking(state, action: PayloadAction<string>) {
      state.bookings = state.bookings.filter(
        (booking) => booking.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Aquí manejamos la acción fetchRecentDrivers
    builder
      .addCase(fetchRecentDrivers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecentDrivers.fulfilled, (state, action) => {
        state.recentDrivers = action.payload; // Guardamos los conductores en el estado
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchRecentDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  fetchBookingsStart,
  fetchBookingsSuccess,
  fetchBookingsFailure,
  updateBookingStart,
  updateBookingSuccess,
  updateBookingFailure,
  setNewBooking,
  closeModal,
  removeBooking,
} = bookingsSlice.actions;


export const updateBookingAsync =
  (booking: Booking) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(updateBookingStart());

    try {
      const db = database;
      const state = getState();
      const bookingRef = ref(db, `bookings/${booking.id}`);
      const trackingRef = ref(db, `tracking/${booking.id}`);
      const singleUserRef = ref(db, `users/${booking.driver}`);

      // Actualizar la reserva en Firebase
      await update(bookingRef, booking);
      dispatch(updateBookingSuccess(booking));

      if (booking.status === "STARTED") {
        const dt = new Date();
        booking.trip_start_time = `${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`;
        booking.startTime = dt.getTime();
        await update(bookingRef, booking);

        const driverLocation = driverProfile.location || { lat: 0, lng: 0 };
        await push(trackingRef, {
          at: new Date().getTime(),
          status: "STARTED",
          lat: driverLocation.lat,
          lng: driverLocation.lng,
        });

        if (booking.customer_token) {
          await sendNotification({
            token: booking.customer_token,
            title: state.languagedata.defaultLanguage.notification_title,
            body:
              state.languagedata.defaultLanguage.driver_journey_msg +
              booking.reference,
            screen: "BookedCab",
            params: { bookingId: booking.id },
          });
        }
      }

      if (booking.status === "REACHED") {
        const driverLocation = driverProfile.location || { lat: 0, lng: 0 };

        await push(trackingRef, {
          at: new Date().getTime(),
          status: "REACHED",
          lat: driverLocation.lat,
          lng: driverLocation.lng,
        });
        /*
      if (booking.customer_token) {
        await sendNotification({
          token: booking.customer_token,
          title: state.languagedata.defaultLanguage.notification_title,
          body: state.languagedata.defaultLanguage.driver_completed_ride,
          screen: 'BookedCab',
          params: { bookingId: booking.id }
        });
      }
        */
      }

      if (booking.status === "PAID") {
        await update(bookingRef, booking);

        if (
          booking.driver === state.auth.currentUser.uid &&
          (booking.prepaid ||
            booking.payment_mode === "cash" ||
            booking.payment_mode === "wallet")
        ) {
          await update(singleUserRef, { queue: false });
        }
        /*
      if (booking.customer_token) {
        await sendNotification({
          token: booking.customer_token,
          title: state.languagedata.defaultLanguage.notification_title,
          body: state.languagedata.defaultLanguage.success_payment,
          screen: 'BookedCab',
          params: { bookingId: booking.id }
        });
      }

      if (booking.driver_token) {
        await sendNotification({
          token: booking.driver_token,
          title: state.languagedata.defaultLanguage.notification_title,
          body: state.languagedata.defaultLanguage.success_payment,
          screen: 'BookedCab',
          params: { bookingId: booking.id }
        });
      }*/
      }

      if (booking.status === "COMPLETE") {
        await update(bookingRef, booking);

        if (booking.rating) {
          const userRatingsRef = ref(db, `userRatings/${booking.driver}`);
          const ratingsSnapshot = await get(userRatingsRef);
          let ratings = ratingsSnapshot.val();
          let rating;
          if (ratings) {
            let sum = 0;
            const arr = Object.values(ratings);
            for (let i = 0; i < arr.length; i++) {
              sum += arr[i].rate;
            }
            sum += booking.rating;
            rating = parseFloat(sum / (arr.length + 1)).toFixed(1);
          } else {
            rating = booking.rating;
          }
          await update(singleUserRef, { rating: rating });
          await push(userRatingsRef, {
            user: booking.customer,
            rate: booking.rating,
          });
        }
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      dispatch(
        updateBookingFailure(
          error instanceof Error ? error.message : "Unknown error"
        )
      );
    }
  };

  export const listenForNewBookings =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    // Función para reproducir el sonido
  /*  const playSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("./../../assets/sounds/taxi.mp3") // Asegúrate de tener este archivo en la carpeta correcta
      );
      await sound.playAsync();
    };
    */

    const newBookingsRef = query(
      ref(database, "bookings"),
      orderByChild("status"),
      equalTo("NEW")
    );

    try {
      onValue(
        newBookingsRef,
        async (snapshot) => {
          const bookingsData: { [key: string]: Booking } = {};

          if (snapshot.exists()) {
            Object.assign(bookingsData, snapshot.val());
          }

          if (Object.keys(bookingsData).length > 0) {
            const newBookings: Booking[] = [];
            for (const key in bookingsData) {
              newBookings.push({ id: key, ...bookingsData[key] });
            }

            const state = getState();
            const driverActiveStatus = state.auth.user.driverActiveStatus;
            const driverCity = state.auth.user.city; // Obtener la ciudad del conductor

            if (driverActiveStatus) {
              // Filtrar las reservas que coincidan con la ciudad del cliente y del conductor
              const matchingCityBookings = newBookings.filter(
                (booking) =>
                  booking.customer_city && // Verificar que la reserva tenga una ciudad del cliente definida
                  driverCity && // Verificar que el conductor tenga una ciudad definida
                  booking.customer_city.toLowerCase() === driverCity.toLowerCase() // Verificar que las ciudades del cliente y conductor coincidan
              );

              //console.log("Driver City:", driverCity);
             // console.log("New Bookings:", newBookings);
             // console.log("Matching City Bookings:", matchingCityBookings);

              // Si no hay reservas que coincidan con la ciudad, no hacer nada
              if (matchingCityBookings.length === 0) {
                console.log(
                  "No hay reservas en la misma ciudad que el conductor."
                );
                return; // Salir de la función sin hacer nada
              }

              // Si hay reservas en la misma ciudad, continuar con el flujo normal
              dispatch(fetchBookingsSuccess(matchingCityBookings));
              dispatch(setNewBooking(matchingCityBookings[0]));
              await playSound();

              const token = state.auth.user.pushToken;
              if (token) {
                try {
                  await axios.post(
                    "https://us-central1-treasupdate.cloudfunctions.net/sendNotification",
                    {
                      token,
                      title: "Nueva Reserva",
                      body: `Tienes una nueva reserva`,
                    }
                  );
                  //console.log("Notificación enviada");
                } catch (error) {
                  if (axios.isAxiosError(error)) {
                    console.log("Error enviando la notificación:", {
                      status: error.response?.status,
                      data: error.response?.data,
                      headers: error.response?.headers,
                    });
                  } else {
                    //console.log("Error desconocido:", error);
                  }
                }
              }
            } else {
              console.log(
                "Driver no está activo, no se envía la notificación."
              );
            }
          } else {
            // Si no hay reservas nuevas, limpiar la lista de reservas
            dispatch(fetchBookingsSuccess([]));
            dispatch(setNewBooking(null));
          }
        },
        (error) => {
          console.error("Error fetching new bookings:", error);
          dispatch(
            fetchBookingsFailure(
              error instanceof Error ? error.message : "Unknown error"
            )
          );
        }
      );
    } catch (error) {
      //console.error("Error setting up listener for new bookings:", error);
      dispatch(
        fetchBookingsFailure(
          error instanceof Error ? error.message : "Unknown error"
        )
      );
    }
  };


  
export const acceptBooking = createAsyncThunk(
  "bookings/acceptBooking",
  async (
    { booking, driverProfile }: { booking: any; driverProfile: any },
    { rejectWithValue }
  ) => {
    try {
      const bookingRef = ref(database, `bookings/${booking.id}`);

      // Asegúrate de que cada campo tenga un valor predeterminado de cadena vacía si es undefined
      const updatedBooking = {
        ...booking,
        driver: driverProfile.uid || driverProfile.id || "",
        driver_image: driverProfile.profile_image || "",
        car_image: driverProfile.car_image || "",
        driver_name: `${driverProfile.firstName || ""} ${
          driverProfile.lastName || ""
        }`,
        driver_contact: driverProfile.mobile || "",
        driver_token: driverProfile.pushToken || "",
        vehicle_number: driverProfile.vehicleNumber || "",
        vehicleModel: driverProfile.vehicleModel || "",
        vehicleMake: driverProfile.vehicleMake || "",
        vehicleColor: driverProfile.vehicleColor || "",
        driverRating: driverProfile.rating || "0",
        status: "ACCEPTED",
        driver_status: `${driverProfile.uid || driverProfile.id || ""}_ACCEPTED`, // Concatenación del driver con el estado
        customer_status: `${booking.customer || ""}_ACCEPTED`,
        drver_city: driverProfile.city || ''
      };

      // Actualiza la reserva en Firebase
      await update(bookingRef, updatedBooking);

      // Verifica que la actualización se haya realizado antes de proceder
      const updatedSnapshot = await get(bookingRef);
      const updatedData = updatedSnapshot.val();

      if (updatedData.driver !== driverProfile.id) {
        throw new Error(
          "La actualización del conductor en la reserva no se completó correctamente."
        );
      }

      // Captura la ubicación del conductor desde el perfil del conductor
      const driverLocation = driverProfile.location || { lat: 0, lng: 0 };

      // Agrega la ubicación del conductor al nodo de tracking en Firebase
      await push(ref(database, `tracking/${booking.id}`), {
        at: new Date().getTime(),
        status: "ACCEPTED",
        lat: driverLocation.lat,
        lng: driverLocation.lng,
      });

      return updatedBooking;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLocation = createAsyncThunk(
  "bookings/updateLocation",
  async (
    { booking, driverProfile }: { booking: any; driverProfile: any },
    { rejectWithValue }
  ) => {
    try {
      const bookingRef = ref(database, `bookings/${booking.id}`);
      // Verifica los valores antes de la actualización
      //console.log("Booking ID:", booking.id);
      //console.log("Driver Profile:", driverProfile);
      // Asegúrate de que cada campo tenga un valor predeterminado de cadena vacía si es undefined
      const updatedBooking = {
        ...booking,
        driver: driverProfile.id || "",
      };
      // Actualiza la reserva en Firebase
      //console.log(updatedBooking, "-------------------------------------------------------------------------------------------------------------------------------------------------");
      
      await update(bookingRef, updatedBooking);
      //console.log("Booking updated successfully in Firebase.");
      // Captura la ubicación del conductor desde el perfil del conductor
      const driverLocation = driverProfile.location || { lat: 0, lng: 0 };
      //console.log("Driver Location:", driverLocation);
      let trackingData = {
        at: new Date().getTime(),
        status: "",
        lat: driverLocation.lat,
        lng: driverLocation.lng,
      };
      if (booking.status === "ACCEPTED") {
        trackingData.status = "ACCEPTED";
      } else if (booking.status === "ARRIVED") {
        trackingData.status = "ARRIVED";
      } else if (booking.status === "STARTED") {
        trackingData.status = "STARTED";
      }
      //console.log("Tracking Data Prepared:", trackingData);
      // Verificar si el estado está definido antes de hacer push
      if (trackingData.status) {
       
        const trackingRef = ref(database, `tracking/${booking.id}`);
        await push(trackingRef, trackingData);
        //console.log("Tracking data saved successfully in Firebase.");
      } else {
        console.error("Invalid booking status, tracking data not saved.");
      }
      return updatedBooking;
    } catch (error) {
      console.error("Error in updateLocation:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const updateBookingStatus = async (booking: Booking) => {
  const bookingRef = ref(database, `bookings/${booking.id}`);
  await update(bookingRef, booking);
  return booking;
};

const trackDriverLocation = async (booking: Booking, driverProfile: any) => {
  const driverLocation = driverProfile.location || { lat: 0, lng: 0 };
  const trackingData = {
    at: new Date().getTime(),
    status: "STARTED",
    lat: driverLocation.lat,
    lng: driverLocation.lng,
  };
  await push(ref(database, `tracking/${booking.id}`), trackingData);
};

const sendNotification = async (notificationData: any) => {
  try {
    await axios.post(
      "https://us-central1-treasupdate.cloudfunctions.net/sendNotification",
      notificationData
    );
  } catch (error) {
    console.error("Error enviando la notificación:", error);
  }
};

export const cancelBooking = createAsyncThunk(
  "bookings/cancelBooking",
  async (
    {
      booking,
      reason,
      cancelledBy,
    }: { booking: Booking; reason: string; cancelledBy: string },
    { rejectWithValue }
  ) => {
    try {
      const currentTime = new Date();

      // Verificar que el id de la reserva esté presente
      if (!booking.id) {
        throw new Error("La reserva no tiene un ID válido.");
      }

      const bookingRef = ref(database, `bookings/${booking.id}`);

      // Preparar la reserva actualizada con el estado CANCELLED
      const updatedBooking = {
        ...booking,
        status: "CANCELLED",
        reason,
        cancelledBy,
        cancellation_time: currentTime.toLocaleTimeString(),
        cancelledAt: currentTime.getTime(),
        driver_status: `${booking.driver || ""}_CANCELLED`,
        customer_status: `${booking.customer || ""}_CANCELLED`,
      };

      // Actualizar la reserva en Firebase
      await update(bookingRef, updatedBooking);

      // Obtener la reserva actualizada desde Firebase para confirmar el cambio
      const updatedSnapshot = await get(bookingRef);
      const updatedData = updatedSnapshot.val();

      // Verificación de éxito en la actualización
      if (!updatedData || updatedData.status !== "CANCELLED") {
        throw new Error(
          "Error al actualizar el estado de la reserva a CANCELLED."
        );
      }

      return updatedBooking;
    } catch (error: any) {
      return rejectWithValue(error.message || "Error al cancelar la reserva.");
    }
  }
);

// Thunk para iniciar la reserva
export const startBooking = createAsyncThunk(
  "bookings/startBooking",
  async (
    { booking, driverProfile }: { booking: Booking; driverProfile: any },

    { rejectWithValue }
  ) => {
    try {
      const currentTime = new Date();
      //console.log("Driver Profile:", driverProfile);

      const updatedBooking = {
        ...booking,
        status: "STARTED",
        trip_start_time: currentTime.toLocaleTimeString(),
        startTime: currentTime.getTime(),
        driver_status: `${booking.driver || ""}_STARTED`, // Concatenación del driver con el estado
        customer_status: `${booking.customer || ""}_STARTED`,
      };

      const bookingResult = await updateBookingStatus(updatedBooking);
      await trackDriverLocation(updatedBooking, driverProfile);
      await sendNotification(updatedBooking);

      return bookingResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeBooking = createAsyncThunk(
  "bookings/completeBooking",
  async (booking: Booking, { rejectWithValue }) => {
    try {
      const updatedBooking = {
        ...booking,
        status: "PAID",
      };

      const bookingResult = await updateBookingStatus(updatedBooking);

      return bookingResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const completePaymentBooking = createAsyncThunk(
  "bookings/completePaymentBooking",
  async (
    { booking, driverProfile }: { booking: Booking; driverProfile: any },
    { rejectWithValue }
  ) => {
    console.log(
      "Iniciando completePaymentBooking con estado de reserva:",
      booking
    );
    try {
      if (booking.status === "COMPLETE") {
        let updatedBooking = {
          ...booking,
          driver_status: `${booking.driver || ""}_COMPLETE`,
          customer_status: `${booking.customer || ""}_COMPLETE`,
        };

        // Update the booking in Firebase, which will trigger the Cloud Function
        const bookingRef = ref(database, `bookings/${booking.id}`);
        await update(bookingRef, updatedBooking);

        return updatedBooking;
      }

      if (booking.status === "REACHED") {
        const trackingRef = ref(database, `tracking/${booking.id}`);
        const driverLocation = driverProfile.location || { lat: 0, lng: 0 };

        await push(trackingRef, {
          at: new Date().getTime(),
          status: "COMPLETE",
          lat: driverLocation.lat,
          lng: driverLocation.lng,
        });

        booking.status = "PAID";
        return await updateBookingStatus(booking);
      }

      if (booking.status === "PAID") {
        booking.status = "COMPLETE";
        booking.driver_status = `${booking.driver || ""}_COMPLETE`;
        booking.customer_status = `${booking.customer || ""}_COMPLETE`;

        // Update the booking in Firebase, which will trigger the Cloud Function
        const bookingRef = ref(database, `bookings/${booking.id}`);
        await update(bookingRef, booking);

        // Additional logic for updating the driver's wallet, etc.
        // ...

        return booking;
      }

      throw new Error("Booking status is not REACHED or PAID");
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);



export const endBooking = createAsyncThunk(
  "bookings/endBooking",
  async (
    { booking, driverProfile }: { booking: Booking; driverProfile: any },
    { rejectWithValue }
  ) => {
    try {
      const driverLocation = driverProfile?.location;

      if (!driverLocation || !driverLocation.lat || !driverLocation.lng) {
        throw new Error("Driver location data is missing");
      }

      // Llama a la función para obtener la dirección desde la latitud y longitud
     /* const address = await getAddressFromCoordinates(
        driverLocation.lat,
        driverLocation.lng
      );*/
      const address = booking.dropAddress;
      console.log("Address found:", address); // Verifica que obtienes la dirección

      if (booking.status === "STARTED") {
        await push(ref(database, `tracking/${booking.id}`), {
          at: new Date().getTime(),
          status: "REACHED",
          lat: driverLocation.lat,
          lng: driverLocation.lng,
        });

        const end_time = new Date();
        const diff =
          (end_time.getTime() - parseFloat(booking.startTime)) / 1000;
        const totalTimeTaken = Math.abs(Math.round(diff));
       
        let updatedBooking = {
          ...booking,
          status: "REACHED",
          trip_end_time: `${end_time.getHours()}:${end_time.getMinutes()}:${end_time.getSeconds()}`,
          endTime: end_time.getTime(),
          total_trip_time: totalTimeTaken,
          driver_status: `${booking.driver || ""}_REACHED`,
          customer_status: `${booking.customer || ""}_REACHED`,
          drop: {
            lat: driverLocation.lat,
            lng: driverLocation.lng,
            add: address, // Guarda la dirección obtenida
          },
        };

        // Llama a addActualsToBooking para realizar los cálculos y actualizar la reserva
        updatedBooking = await addActualsToBooking(
          updatedBooking,
          booking.dropAddress,
          {
            lat: booking.drop.lat,
            lng: booking.drop.lng,
          }
        ); 

        // Actualizar el campo savedAddresses del usuario en tiempo real
        console.log(
          "Iniciando la actualización de savedAddresses para el usuario:",
          booking.customer
        );
        const savedAddressesRef = ref(
          database,
          `users/${booking.customer}/savedAddresses`
        );
        console.log(
          "Referencia de savedAddresses creada:",
          savedAddressesRef.toString()
        );

        const newAddress = {
          description: booking.drop.add,
          lat: booking.drop.lat,
          lng: booking.drop.lng,
        };
        console.log("Nuevo objeto de dirección a guardar:", newAddress);

        await push(savedAddressesRef, newAddress);
        console.log("Dirección guardada exitosamente en savedAddresses.");

        if (booking.customer_token) {
          await sendNotification({
            token: booking.customer_token,
            title: "T+plus",
            body: "PAGO PENDIENTE",
            params: { bookingId: booking.id },
          });
        }

        return updatedBooking;
      } else {
        throw new Error("El viaje no está en estado 'STARTED'.");
      }
    } catch (error: any) {
      console.error("Error in endBooking:", error.message || error);
      return rejectWithValue(error.message || "Error al finalizar la reserva");
    }
  }
);

export const arriveBooking = createAsyncThunk(
  "bookings/arriveBooking",
  async (booking: Booking, { rejectWithValue }) => {
    try {
      if (booking.status === "ACCEPTED") {
        // Verificar que `booking.drop` y sus campos lat/lng existan
        if (!booking.drop || !booking.drop.lat || !booking.drop.lng) {
          throw new Error("Información de ubicación incompleta en la reserva");
        }

        const arrived_time = new Date().toISOString(); // Convertir a formato ISO 8601

        const updatedBooking = {
          ...booking,
          status: "ARRIVED",
          driver_arrived_time: arrived_time, // Añadir el campo `driver_arrived_time`
          driver_status: `${booking.driver || ""}_ARRIVED`, // Concatenación del driver con el estado
          customer_status: `${booking.customer || ""}_ARRIVED`,
        };

        // Verificar si existe `booking.uid` o `booking.id` y lanzar un error si ninguno existe
        const bookingId = booking.uid || booking.id;
        if (!bookingId) {
          throw new Error("El ID de la reserva es indefinido");
        }

        // Actualizar la reserva existente en la base de datos usando `booking.uid` o `booking.id`
        await update(ref(database, `bookings/${bookingId}`), updatedBooking);

        // Enviar notificación al cliente si el token está disponible
        if (booking.customer_token) {
          await sendNotification({
            token: booking.customer_token,
            title: "T+plus",
            body: "Tu conductor ha llegado",
            params: { bookingId: bookingId },
          });
        }

        return updatedBooking;
      } else {
        throw new Error("El viaje no está en estado 'ACCEPTED'.");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Error al finalizar la reserva");
    }
  }
);

export const fetchRecentDrivers = createAsyncThunk(
  "bookings/fetchRecentDrivers",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const currentUser = state.auth.user;
      if (!currentUser || !currentUser.uid) {
        throw new Error("Usuario no autenticado o sin UID");
      }

      const q = query(
        ref(database, `bookings`),
        orderByChild("customer_status"),
        equalTo(`${currentUser.uid}_COMPLETE`),
        limitToLast(5)
      );
      const bookingsSnapshot = await get(q);

      if (!bookingsSnapshot.exists()) {
        throw new Error("No bookings found");
      }

      const bookings = bookingsSnapshot.val();
      const drivers = [];

      for (const bookingId in bookings) {
        const booking = bookings[bookingId];
        if (booking.driver) {
          drivers.push({
            driver: booking.driver,
            driver_name: booking.driver_name,
          });
        }
      }

      //console.log("Filtered recent drivers:", drivers); // <-- Asegúrate de que esto esté funcionando
      return drivers; // Esto se devuelve al estado
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const shareDriverLocation = createAsyncThunk(
  "bookings/shareDriverLocation",
  async ({ bookingId }, { getState }) => {
    const state = getState();
    const db = database;

    // Obtener la reserva para encontrar el driverId
    const bookingRef = ref(db, `bookings/${bookingId}`);
    const bookingSnapshot = await get(bookingRef);
    if (!bookingSnapshot.exists()) {
      throw new Error("Reserva no encontrada.");
    }

    const bookingData = bookingSnapshot.val();
    const driverId = bookingData.driver;

    // Obtener la ubicación del conductor
    const driverRef = ref(db, `users/${driverId}/location`);
    const driverSnapshot = await get(driverRef);
    if (!driverSnapshot.exists()) {
      throw new Error("Conductor no encontrado.");
    }

    const driverLocation = driverSnapshot.val();

    // Llamar a la función de la API para compartir la ubicación
    const response = await fetch("https://us-central1-treasupdate.cloudfunctions.net/shareDriverLocation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: driverId,
        location: driverLocation,
      }),
    });

    if (!response.ok) {
      throw new Error("Error al compartir la ubicación del conductor.");
    }

    return { message: "Ubicación del conductor compartida con éxito." };
  }
);

export const reportIncident = createAsyncThunk(
  "bookings/reportIncident",
  async ({ bookingId, incident }, { rejectWithValue }) => {
    try {
      console.log("Iniciando el reporte de incidente...");
      console.log("ID de la reserva:", bookingId);
      console.log("Incidente:", incident);

      const bookingRef = ref(database, `bookings/${bookingId}`);
      console.log("Referencia de la reserva obtenida:", bookingRef);

      // Obtener los datos actuales de la reserva
      const bookingSnapshot = await get(bookingRef);
      if (!bookingSnapshot.exists()) {
        throw new Error("Reserva no encontrada.");
      }

      const bookingData = bookingSnapshot.val();

      const updatedBooking = {
        ...bookingData, // Mantener los datos actuales de la reserva
        
        incident: incident ,// Agregar la información del incidente
        driver: "",
        driver_image: "",
        car_image: "",
        driver_name: "",
        driver_contact: "",
        driver_token: "",
        vehicle_number: "",
        vehicleModel: "",
        vehicleMake: "",
        vehicleColor: "",
        driverRating: "0",
        status: "NEW",
        driver_status: "",
        customer_status: `${bookingData.customer || ""}_NEW`,
        drver_city: "",
      };

      console.log("Datos de la reserva actualizados:", updatedBooking);

      await update(bookingRef, updatedBooking);
      console.log("Reserva actualizada con éxito");
      return { message: "Incidente reportado con éxito." };
    } catch (error) {
      console.error("Error al actualizar la reserva:", error);
      return rejectWithValue(error.message);
    }
  }
);

export default bookingsSlice.reducer;