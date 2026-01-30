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
  // Dados padrão caso a API falhe (7 dias de histórico)
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

  try {
    // Usa nossa API Route que faz as requisições no servidor
    const response = await fetch('/api/market');
    
    if (!response.ok) {
      console.error('Falha ao buscar dados de mercado:', response.statusText);
      return defaultData;
    }

    const data = await response.json();
    
    return {
      usd: {
        current: data.usd.current,
        change: data.usd.change,
        history: data.usd.history,
        dates: data.usd.dates?.length ? data.usd.dates : defaultDates
      },
      ibovespa: {
        current: data.ibovespa.current,
        change: data.ibovespa.change,
        history: data.ibovespa.history,
        dates: data.ibovespa.dates?.length ? data.ibovespa.dates : defaultDates
      },
    };
  } catch (error) {
    console.error('Erro ao buscar dados de mercado:', error);
    return defaultData;
  }
};
