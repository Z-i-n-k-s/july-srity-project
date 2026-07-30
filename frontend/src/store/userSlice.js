import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  loading: true,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.user = action.payload;
      state.loading = false;
    },
    setAuthLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
  },
});

export const { setUserDetails, setAuthLoading } = userSlice.actions;
export default userSlice.reducer;
