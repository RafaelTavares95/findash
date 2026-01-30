import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchMarketData, MarketData } from '@/services/marketService';

interface MarketState {
  usd: {
    current: number;
    change: number;
    history: number[];
    dates: string[];
  };
  ibovespa: {
    current: number;
    change: number;
    history: number[];
    dates: string[];
  };
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

// Estado inicial com valores estáticos para evitar hydration mismatch
// Os dados reais serão carregados pela API no useEffect
const initialState: MarketState = {
  usd: {
    current: 0,
    change: 0,
    history: [],
    dates: [],
  },
  ibovespa: {
    current: 0,
    change: 0,
    history: [],
    dates: [],
  },
  lastUpdated: '',
  loading: true, // Começa como true para mostrar loading
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
