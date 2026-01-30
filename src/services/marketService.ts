export interface MarketData {
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
  // Dados padrão caso a API falhe
  const defaultData: MarketData = {
    usd: { current: 5.42, change: 0.15, history: [5.38, 5.40, 5.41, 5.42] },
    ibovespa: { current: 128500, change: -0.45, history: [129200, 129000, 128800, 128500] },
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
      usd: data.usd,
      ibovespa: data.ibovespa,
    };
  } catch (error) {
    console.error('Erro ao buscar dados de mercado:', error);
    return defaultData;
  }
};
