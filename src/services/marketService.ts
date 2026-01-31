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

  // --- Processamento USD ---
  let usdData = serverData?.usd;
  
  // Fallback Client-side para USD apenas se falhar severamente o server e não tiver dados
  if ((!usdData || usdData.current === 0) && hasServerError) {
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

  return {
    usd: usdData,
    ibovespa: serverData?.ibovespa || defaultData.ibovespa
  };
};
