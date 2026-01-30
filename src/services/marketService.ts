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

  let serverData = null;
  let hasServerError = false;

  try {
    // 1. Tenta buscar da nossa API Route
    const response = await fetch('/api/market', { cache: 'no-store' });
    
    if (response.ok) {
      const data = await response.json();
      serverData = data;
      // Se a API reportar erro interno, marcamos para tentar fallback
      if (data.hasError) {
        console.warn('API Route reportou erro parcial, tentando fallback para USD...');
        hasServerError = true;
      }
    } else {
      hasServerError = true;
    }
  } catch (error) {
    console.error('Erro ao buscar dados de mercado (Server):', error);
    hasServerError = true;
  }

  // 2. Se a API falhou ou retornou erro, ou o valor parece ser o default (5.42 e 0.15),
  // tentamos buscar USD direto no cliente (melhor que nada)
  let usdData = serverData?.usd;
  
  const isDefaultValue = usdData && usdData.current === 5.42 && usdData.change === 0.15;
  
  if (hasServerError || !usdData || isDefaultValue) {
    try {
      console.log('Tentando fetch direto do USD (Client-side Fallback)...');
      const directResponse = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      
      if (directResponse.ok) {
        const directJson = await directResponse.json();
        const usd = directJson.USDBRL;
        
        // Histórico simples simulado já que não temos o endpoint de histórico aqui
        // ou mantemos o que veio do server se existir
        usdData = {
          current: parseFloat(usd.bid),
          change: parseFloat(usd.pctChange),
          history: usdData?.history || [parseFloat(usd.bid)], // Mantém histórico se tiver, ou array unitário
          dates: usdData?.dates || defaultDates
        };
      }
    } catch (clientError) {
      console.error('Erro no fallback client-side:', clientError);
      // Se falhar o fallback, usa o do server (mesmo que default) ou o default total
      usdData = usdData || defaultData.usd;
    }
  }

  return {
    usd: usdData || defaultData.usd,
    ibovespa: serverData?.ibovespa || defaultData.ibovespa
  };
};
