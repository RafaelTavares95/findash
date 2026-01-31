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
 * - Permite persistência do histórico (Blob em prod, arquivo local em dev)
 */
export const fetchMarketData = async (): Promise<MarketData> => {
  // Dados padrão caso tudo falhe
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
    const response = await fetch('/api/market', { cache: 'no-store' });
    
    if (response.ok) {
      const data = await response.json();
      
      // Se a API reportar erro interno, loga mas continua com os dados disponíveis
      if (data.hasError) {
        console.warn('API Route reportou erro parcial ao buscar dados.');
      }
      
      return {
        usd: data.usd || defaultData.usd,
        ibovespa: data.ibovespa || defaultData.ibovespa
      };
    } else {
      console.error('Erro na resposta da API:', response.status);
      return defaultData;
    }
  } catch (error) {
    console.error('Erro ao buscar dados de mercado:', error);
    return defaultData;
  }
};
