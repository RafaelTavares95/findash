import { configureStore } from '@reduxjs/toolkit';
import marketReducer from './slices/marketSlice';
import reservesReducer from './slices/reservesSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    market: marketReducer,
    reserves: reservesReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
