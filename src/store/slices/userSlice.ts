import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
}

interface UserState {
  currentUser: User | null;
}

const initialState: UserState = {
  currentUser: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('findash_user', JSON.stringify(action.payload));
        } else {
          localStorage.removeItem('findash_user');
        }
      }
    },
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
