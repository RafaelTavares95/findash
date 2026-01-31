export interface MarketData {
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
}

/**
 * Busca dados de mercado através da nossa API Route.
 * 
 * Por que usar API Route?
 * - Evita problemas de CORS: requisições a APIs externas são feitas no servidor
 * - Centraliza a lógica de busca de dados
 * - Permite cache no servidor (revalidate)
 */
export const fetchMarketData = async (): Promise<MarketData> => {
  // Dados padrão caso tudo falhe (inicial apenas para estrutura)
  const defaultDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  });

  const defaultData: MarketData = {
    usd: { 
      current: 5.42, 
      change: 0.15, 
      history: [5.38, 5.39, 5.40, 5.41, 5.42, 5.43, 5.42],
      dates: defaultDates
    },
    ibovespa: { 
      current: 128500, 
      change: -0.45, 
      history: [127500, 128000, 128200, 128800, 129000, 128700, 128500],
      dates: defaultDates
    },
  };

  let serverData = null;
  let hasServerError = false;

  try {
    // 1. Tenta buscar da nossa API Route
    const response = await fetch('/api/market', { cache: 'no-store' });
    
    if (response.ok) {
      const data = await response.json();
      serverData = data;
      // Se a API reportar erro interno, continuamos mas atentos
      if (data.hasError) {
        console.warn('API Route reportou erro parcial.');
        hasServerError = true;
      }
    } else {
      hasServerError = true;
    }
  } catch (error) {
    console.error('Erro ao buscar dados de mercado (Server):', error);
    hasServerError = true;
  }

  // Helper para persistência local
  const updateLocalHistory = (key: string, current: number, currentHist: number[], currentDates: string[], isFromServer: boolean): { history: number[], dates: string[] } => {
    if (typeof window === 'undefined') return { history: currentHist, dates: currentDates };

    try {
      const storageKey = `market_history_${key}`;
      const saved = localStorage.getItem(storageKey);
      let localData = saved ? JSON.parse(saved) : { history: [], dates: [] };
      
      const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      // Se veio histórico completo do servidor (ex: USD via AwesomeAPI), confiamos mais nele
      if (isFromServer && currentHist.length > 3) {
        localData = { history: currentHist, dates: currentDates };
        localStorage.setItem(storageKey, JSON.stringify(localData));
        return localData;
      }

      // Se não, fazemos append manual
      const lastDate = localData.dates[localData.dates.length - 1];

      if (lastDate === today) {
        // Atualiza valor de hoje
        localData.history[localData.history.length - 1] = current;
      } else {
        // Adiciona novo dia
        localData.dates.push(today);
        localData.history.push(current);
      }

      // Mantém janela de 7 dias
      if (localData.dates.length > 7) {
        localData.dates = localData.dates.slice(-7);
        localData.history = localData.history.slice(-7);
      }
      
      // Se tiver vazio ou muito curto, preenche pra tras com o valor atual para nao ficar feio o grafico
      while (localData.dates.length < 7) {
         localData.history.unshift(current);
         localData.dates.unshift("...");
      }

      localStorage.setItem(storageKey, JSON.stringify(localData));
      return { history: localData.history, dates: localData.dates };

    } catch (e) {
      console.error('Erro ao salvar histórico local:', e);
      return { history: currentHist, dates: currentDates };
    }
  };

  // --- Processamento USD ---
  let usdData = serverData?.usd;
  // Fallback Client-side para USD se falhar server
  if (!usdData || usdData.current === 0) {
     try {
        const [currentRes, historyRes] = await Promise.all([
          fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL'),
          fetch('https://economia.awesomeapi.com.br/json/daily/USD-BRL/7')
        ]);
        if (currentRes.ok) {
           const json = await currentRes.json();
           const histJson = historyRes.ok ? await historyRes.json() : [];
           const sortedHist = Array.isArray(histJson) ? [...histJson].reverse() : [];
           
           usdData = {
              current: parseFloat(json.USDBRL.bid),
              change: parseFloat(json.USDBRL.pctChange),
              history: sortedHist.map((i: any) => parseFloat(i.bid)),
              dates: sortedHist.map((i: any) => new Date(parseInt(i.timestamp)*1000).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}))
           };
        }
     } catch (e) { console.error(e) }
  }
  usdData = usdData || defaultData.usd;
  
  // Persiste/Atualiza histórico USD
  // Para USD, se vier da API (server ou client fetch) já vem histórico, então 'isFromServer=true' costuma ser o caso.
  // Mas garantimos via localStorage também
  const usdPersisted = updateLocalHistory('usd', usdData.current, usdData.history, usdData.dates, usdData.history.length > 1);
  usdData.history = usdPersisted.history;
  usdData.dates = usdPersisted.dates;


  // --- Processamento Ibovespa ---
  let ibovData = serverData?.ibovespa;
  ibovData = ibovData || defaultData.ibovespa;

  // Persiste/Atualiza histórico Ibovespa
  // Ibov só tem valor atual vindo do server agora. O histórico deve ser construído localmente.
  // Se o histórico vindo do server for vazio ou dummy, isFromServer=false para forçar append
  const hasExternalIbovHistory = ibovData.history && ibovData.history.length > 1 && ibovData.history[0] !== ibovData.history[1];
  
  const ibovPersisted = updateLocalHistory('ibov', ibovData.current, ibovData.history, ibovData.dates, !!hasExternalIbovHistory);
  ibovData.history = ibovPersisted.history;
  ibovData.dates = ibovPersisted.dates;


  return {
    usd: usdData,
    ibovespa: ibovData
  };
};
