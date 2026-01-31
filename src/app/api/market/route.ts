import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HistoricalUSD {
  bid: string;
  timestamp: string;
}

export async function GET() {
  let usdData = { 
    current: 0, 
    change: 0, 
    history: [] as number[],
    dates: [] as string[]
  };
  let ibovData = { 
    current: 0, 
    change: 0, 
    history: [] as number[],
    dates: [] as string[]
  };
  let hasError = false;

  // 1. Fetch USD atual e histórico dos últimos 7 dias via API Externa
  try {
    // Busca cotação atual
    const usdCurrentResponse = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');

    // Busca histórico dos últimos 7 dias
    const usdHistoryResponse = await fetch('https://economia.awesomeapi.com.br/json/daily/USD-BRL/7');
    
    if (usdCurrentResponse.ok) {
      const usdCurrentJson = await usdCurrentResponse.json();
      const usd = usdCurrentJson.USDBRL;
      
      let historyValues = [] as number[];
      let historyDates = [] as string[];
      
      // Se conseguiu o histórico, usa os dados reais da API
      if (usdHistoryResponse.ok) {
        const historyJson: HistoricalUSD[] = await usdHistoryResponse.json();
        const sortedHistory = [...historyJson].reverse();
        
        historyValues = sortedHistory.map(item => parseFloat(item.bid));
        historyDates = sortedHistory.map(item => {
          const date = new Date(parseInt(item.timestamp) * 1000);
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        });
      } else {
        // Fallback se falhar o histórico
        historyValues = [parseFloat(usd.bid)];
        historyDates = [new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })];
      }
      
      usdData = {
        current: parseFloat(usd.bid),
        change: parseFloat(usd.pctChange),
        history: historyValues,
        dates: historyDates
      };
    }
  } catch (error) {
    console.error('Falha ao buscar USD:', error);
    hasError = true;
  }

  // 2. Fetch Ibovespa (HG Brasil - Apenas atual)
  try {
    const hgResponse = await fetch('https://api.hgbrasil.com/finance?format=json-cors&key=development');
    
    if (hgResponse.ok) {
      const hgJson = await hgResponse.json();
      if (hgJson.results && hgJson.results.stocks && hgJson.results.stocks.IBOVESPA) {
        const ibov = hgJson.results.stocks.IBOVESPA;
        
        ibovData = {
          current: ibov.points,
          change: ibov.variation,
          history: [], // Histórico será gerado/persistido no Cliente (LocalStorage)
          dates: []
        };
      }
    }
  } catch (error) {
    console.error('Falha ao buscar Ibovespa (HG):', error);
    hasError = true;
  }

  return NextResponse.json({
    usd: usdData,
    ibovespa: ibovData,
    hasError
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}
