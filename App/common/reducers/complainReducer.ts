import { createSlice } from '@reduxjs/toolkit';
import { addComplain, editComplain, fetchComplains } from '../store/complainSlice';

interface ComplainState {
  list: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ComplainState = {
  list: [],
  loading: false,
  error: null,
};

const complainSlice = createSlice({
  name: 'complains',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addComplain.pending, (state) => {
        state.loading = true;
      })
      .addCase(addComplain.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(addComplain.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(editComplain.pending, (state) => {
        state.loading = true;
      })
      .addCase(editComplain.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex(
          (complain) => complain.id === action.payload.id
        );
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(editComplain.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchComplains.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchComplains.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchComplains.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default complainSlice.reducer;