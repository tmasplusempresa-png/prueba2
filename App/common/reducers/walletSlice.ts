import { createSlice } from '@reduxjs/toolkit';
import { database } from '@/config/SupabaseConfig'; // Asegúrate que esto es correcto
import { ref, get } from 'firebase/database';
import { RootState } from '@/common/store';
import { createSelector } from 'reselect';

interface WalletState {
  history: any[];
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  history: [],
  loading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    fetchStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSuccess(state, action) {
      state.history = action.payload ? Object.values(action.payload) : [];
      state.loading = false;
    },
    fetchFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { fetchStart, fetchSuccess, fetchFailure } = walletSlice.actions;

export const fetchWalletHistory = (userId: string) => async (dispatch) => {
  try {
    //console.log(userId, "si llegamos"); // Log para verificar el userId
    dispatch(fetchStart());

    const walletHistoryRef = ref(database, `walletHistory/${userId}`);

    const snapshot = await get(walletHistoryRef);
//console.log("data",snapshot)
    if (snapshot.exists()) {
      dispatch(fetchSuccess(snapshot.val()));
    } else {
      dispatch(fetchFailure('No history found'));
    }
  } catch (error) {
    console.error("Error fetching wallet history:", error); // Log para errores
    dispatch(fetchFailure(error.message));
  }
};

const selectWalletState = (state: RootState) => state.wallet;

export const selectWalletHistory = createSelector(
  [selectWalletState],
  (wallet) => wallet?.history || []
);

export const selectWalletLoading = createSelector(
  [selectWalletState],
  (wallet) => wallet?.loading || false
);

export const selectWalletError = createSelector(
  [selectWalletState],
  (wallet) => wallet?.error || null
);

export default walletSlice.reducer;
