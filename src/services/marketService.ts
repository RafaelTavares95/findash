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

export const fetchMarketData = async (): Promise<MarketData> => {
  let usdData = { current: 5.42, change: 0.15, history: [5.38, 5.40, 5.41, 5.42] };
  let ibovData = { current: 128500, change: -0.45, history: [129200, 129000, 128800, 128500] };

  // 1. Fetch USD from AwesomeAPI
  try {
    const usdResponse = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    const usdJson = await usdResponse.json();
    const usd = usdJson.USDBRL;
    usdData = {
      current: parseFloat(usd.bid),
      change: parseFloat(usd.pctChange),
      history: [5.38, 5.40, 5.41, parseFloat(usd.bid)],
    };
  } catch (error) {
    console.error('Falha ao buscar USD:', error);
  }

  // 2. Fetch Ibovespa from HG Brasil
  try {
    const hgResponse = await fetch('https://api.hgbrasil.com/finance?format=json-cors&key=development');
    const hgJson = await hgResponse.json();
    if (hgJson.results && hgJson.results.stocks && hgJson.results.stocks.IBOVESPA) {
      const ibov = hgJson.results.stocks.IBOVESPA;
      ibovData = {
        current: ibov.points,
        change: ibov.variation,
        history: [129200, 129000, 128800, ibov.points],
      };
    }
  } catch (error) {
    console.error('Falha ao buscar Ibovespa:', error);
  }

  return {
    usd: usdData,
    ibovespa: ibovData,
  };
};
