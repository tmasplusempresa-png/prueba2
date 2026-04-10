import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../reducers/authReducer';
import walletReducer from '../reducers/walletSlice';
import bookingsReducer from '../../common/store/bookingsSlice.ts'; // Ajusta la ruta según tu estructura de proyecto
import vehicleReducer from './vehicleSlice';
import promosReducer from "../reducers/promosReducer";
import complainReducer from "../reducers/complainReducer";
import membershipReducer from "../reducers/membershipSlice";
import settingsReducer from "../reducers/settingsSlice"; // Importa el reducer de settings

const store = configureStore({
  reducer: {
    bookings: bookingsReducer,
    auth: authReducer,
    wallet: walletReducer,
    vehicles: vehicleReducer,
    promodata: promosReducer,
    complains: complainReducer, // Asegúrate de que este nombre coincida con lo que usas en useSelector
    memberships: membershipReducer,
    settings: settingsReducer, 
    // otros reducers...
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Desactiva la verificación de serializabilidad
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;