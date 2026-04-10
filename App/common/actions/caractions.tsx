import { createAsyncThunk } from '@reduxjs/toolkit';
import { getDatabase, ref, query, equalTo, orderByChild, get, push, set, update,onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';


// Fetch user cars action remains unchanged
export const fetchUserCars = createAsyncThunk(
  'vehicles/fetchUserCars',
  (uid: string, thunkAPI) => {
    const db = getDatabase();
    const carsRef = ref(db, 'cars');
    const userCarsQuery = query(carsRef, orderByChild('driver'), equalTo(uid));

    return new Promise((resolve, reject) => {
      onValue(
        userCarsQuery,
        (snapshot) => {
          if (snapshot.exists()) {
            const carsData = snapshot.val();
            const carsArray = Object.keys(carsData).map((key) => ({
              id: key,
              ...carsData[key],
            }));
            resolve(carsArray);
          } else {
            resolve([]);
          }
        },
        (error) => {
          reject(thunkAPI.rejectWithValue(error));
        }
      );
    });
  }
);

// Add car and upload image to storage
export const addCar = createAsyncThunk(
  'vehicles/addCar',
  async ({ vehicle, imageUriVehicle }: { vehicle: Vehicle, imageUriVehicle: string | null }, thunkAPI) => {
    const db = getDatabase();
    const storage = getStorage();
    const carsRef = ref(db, 'cars');

    try {
      // Paso 1: Crear el vehículo en la base de datos
      const newCarRef = push(carsRef);
      await set(newCarRef, vehicle);

      const carUid = newCarRef.key;
      //console.log("asasas",carUid)
      //console.log("imageuri",imageUriVehicle)

      let downloadURL = "";

      // Paso 2: Subir la imagen a Firebase Storage
      if (imageUriVehicle && carUid) {
        try {
          const imageStorageRef = storageRef(storage, `cars/${carUid}`);
          const response = await fetch(imageUriVehicle);

          if (!response.ok) {
            throw new Error(`Error al obtener la imagen desde URI: ${response.statusText}`);
          }

          const blob = await response.blob();
          await uploadBytes(imageStorageRef, blob)
            .then(async () => {
              downloadURL = await getDownloadURL(imageStorageRef);
            })
            .catch((uploadError) => {
              throw new Error(`Error al subir la imagen: ${uploadError.message}`);
            });

          // Paso 3: Actualizar el objeto del vehículo con la URL de la imagen
          try {
            const carUpdate = { car_image: downloadURL };
            await update(ref(db, `cars/${carUid}`), carUpdate);
          } catch (updateError) {
            throw new Error(`Error al actualizar el vehículo con la URL de la imagen: ${updateError.message}`);
          }

        } catch (uploadError) {
          console.error("Error al procesar la subida de la imagen:", uploadError);
          return thunkAPI.rejectWithValue(uploadError.message);
        }
      } else {
        console.warn("No se seleccionó ninguna imagen o el UID del vehículo no se generó correctamente.");
      }

      return { id: carUid, ...vehicle, car_image: downloadURL };

    } catch (err) {
      console.error("Error al crear el vehículo:", err);
      return thunkAPI.rejectWithValue(`Error al crear el vehículo: ${err.message}`);
    }
  }
);
