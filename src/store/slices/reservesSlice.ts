import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ReserveHistory {
  date: string;
  amount: number;
}

export interface ReserveSlot {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  history: ReserveHistory[];
}

interface ReservesState {
  slots: ReserveSlot[];
}

const initialState: ReservesState = {
  slots: [],
};

const reservesSlice = createSlice({
  name: 'reserves',
  initialState,
  reducers: {
    addSlot: (state, action: PayloadAction<Omit<ReserveSlot, 'id' | 'currentAmount' | 'history'>>) => {
      const newSlot: ReserveSlot = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        currentAmount: 0,
        history: [{ date: new Date().toISOString().split('T')[0], amount: 0 }],
      };
      state.slots.push(newSlot);
    },
    addValueToSlot: (state, action: PayloadAction<{ id: string; amount: number }>) => {
      const slot = state.slots.find((s) => s.id === action.payload.id);
      if (slot) {
        slot.currentAmount += action.payload.amount;
        slot.history.push({
          date: new Date().toISOString().split('T')[0],
          amount: slot.currentAmount,
        });
      }
    },
    removeSlot: (state, action: PayloadAction<string>) => {
      state.slots = state.slots.filter((s) => s.id !== action.payload);
    },
    setSlots: (state, action: PayloadAction<ReserveSlot[]>) => {
      state.slots = action.payload;
    },
  },
});

export const { addSlot, addValueToSlot, removeSlot, setSlots } = reservesSlice.actions;
export default reservesSlice.reducer;
