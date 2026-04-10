// src/common/store.ts

import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../reducers/reducers'; // Asegúrate de importar desde la ruta correcta


const store = configureStore({
  reducer: rootReducer,

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
