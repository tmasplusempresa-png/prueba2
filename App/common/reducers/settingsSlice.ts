// settingsSlice.ts

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/common/store";
import { ref, get, set, onValue } from "firebase/database";
import { database } from "@/config/SupabaseConfig";

// Action to set settings in the Redux store
export const setSettings = createAsyncThunk(
  "settings/setSettings",
  async (settingsData: any, { dispatch }) => {
    dispatch(settingsSlice.actions.setSettings(settingsData));
  }
);

// Thunk to listen to settings changes
export const listenToSettingsChanges = createAsyncThunk(
  "settings/listenToSettingsChanges",
  async (_, { dispatch }) => {
   // console.log("Setting up listener for settings changes...");
    const settingsRef = ref(database, "settings/");
    onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.val();
        dispatch(setSettings(settings));
      } else {
        console.log("Settings data was removed from Firebase.");
        dispatch(setSettings({}));
      }
    });
  }
);

// Thunk to update settings in Firebase
export const updateSettings = createAsyncThunk(
  "settings/updateSettings",
  async (settingsData: any) => {
    console.log("Dispatching updateSettings action with data:", settingsData);
    const response = await apiUpdateSettings(settingsData);
    console.log("updateSettings response:", response);
    return response;
  }
);

// Function to update settings in Firebase
const apiUpdateSettings = async (settingsData: any) => {
  try {
    console.log("Updating settings in Firebase with data:", settingsData);
    const settingsRef = ref(database, "settings/");
    await set(settingsRef, settingsData);
    console.log("Settings updated successfully:", settingsData);
    return settingsData;
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
};

// Initial state of the slice
interface SettingsState {
  settings: any;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: {},
  loading: false,
  error: null,
};

// Slice for settings
const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    clearSettingsError: (state) => {
      console.log("Clearing settings error...");
      state.error = null;
    },
    setSettings: (state, action) => {
     // console.log("Setting settings with payload:", action.payload);
      state.settings = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Update settings
      .addCase(updateSettings.pending, (state) => {
        console.log("updateSettings pending...");
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        console.log("updateSettings fulfilled with payload:", action.payload);
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        console.error("updateSettings rejected with error:", action.error.message);
        state.loading = false;
        state.error =
          action.error.message || "Error updating settings";
      });
  },
});

// Export actions and reducer
export const { clearSettingsError } = settingsSlice.actions;
export default settingsSlice.reducer;

// Selectors
export const selectSettings = (state: RootState) => {
 // console.log("Selecting settings from state:", state.settings.settings);
  return state.settings.settings;
};
export const selectSettingsLoading = (state: RootState) => {
 // console.log("Selecting settings loading state:", state.settings.loading);
  return state.settings.loading;
};
export const selectSettingsError = (state: RootState) => {
 // console.log("Selecting settings error state:", state.settings.error);
  return state.settings.error;
};
