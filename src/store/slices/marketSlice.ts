import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchMarketData, MarketData } from '@/services/marketService';

interface MarketState {
  usd: {
    current: number;
    change: number;
    history: number[];
  };
  ibovespa: {
    current: number;
    change: number;
    history: number[];
  };
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

const initialState: MarketState = {
  usd: {
    current: 5.42,
    change: 0.15,
    history: [5.38, 5.40, 5.41, 5.42],
  },
  ibovespa: {
    current: 128500,
    change: -0.45,
    history: [129200, 129000, 128800, 128500],
  },
  lastUpdated: new Date().toISOString(),
  loading: false,
  error: null,
};

export const getMarketData = createAsyncThunk(
  'market/fetchData',
  async () => {
    const data = await fetchMarketData();
    return data;
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    updateMarketData: (state, action: PayloadAction<Partial<MarketState>>) => {
      return { ...state, ...action.payload, lastUpdated: new Date().toISOString() };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMarketData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMarketData.fulfilled, (state, action: PayloadAction<MarketData>) => {
        state.loading = false;
        state.usd = action.payload.usd;
        state.ibovespa = action.payload.ibovespa;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getMarketData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar dados do mercado';
      });
  },
});

export const { updateMarketData } = marketSlice.actions;
export default marketSlice.reducer;
