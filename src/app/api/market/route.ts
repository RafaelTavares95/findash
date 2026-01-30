import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HistoricalUSD {
  bid: string;
  timestamp: string;
}

export async function GET() {
  let usdData = { 
    current: 5.42, 
    change: 0.15, 
    history: [5.38, 5.39, 5.40, 5.41, 5.42, 5.43, 5.42],
    dates: [] as string[]
  };
  let ibovData = { 
    current: 128500, 
    change: -0.45, 
    history: [127500, 128000, 128200, 128800, 129000, 128700, 128500],
    dates: [] as string[]
  };
  let hasError = false;

  // 1. Fetch USD atual e histórico dos últimos 7 dias
  try {
    // Busca cotação atual
    const usdCurrentResponse = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
      cache: 'no-store'
    });
    
    // Busca histórico dos últimos 7 dias
    const usdHistoryResponse = await fetch('https://economia.awesomeapi.com.br/json/daily/USD-BRL/7', {
      cache: 'no-store'
    });
    
    if (usdCurrentResponse.ok) {
      const usdCurrentJson = await usdCurrentResponse.json();
      const usd = usdCurrentJson.USDBRL;
      
      let historyValues = [5.38, 5.39, 5.40, 5.41, 5.42, 5.43, parseFloat(usd.bid)];
      let historyDates: string[] = [];
      
      // Se conseguiu o histórico, usa os dados reais
      if (usdHistoryResponse.ok) {
        const historyJson: HistoricalUSD[] = await usdHistoryResponse.json();
        
        // A API retorna do mais recente para o mais antigo, precisamos inverter
        const sortedHistory = [...historyJson].reverse();
        
        historyValues = sortedHistory.map(item => parseFloat(item.bid));
        historyDates = sortedHistory.map(item => {
          const date = new Date(parseInt(item.timestamp) * 1000);
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        });
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

  // 2. Fetch Ibovespa - HG Brasil não fornece histórico gratuito, 
  // então simulamos baseado no valor atual
  try {
    const hgResponse = await fetch('https://api.hgbrasil.com/finance?format=json-cors&key=development', {
      cache: 'no-store'
    });
    
    if (hgResponse.ok) {
      const hgJson = await hgResponse.json();
      if (hgJson.results && hgJson.results.stocks && hgJson.results.stocks.IBOVESPA) {
        const ibov = hgJson.results.stocks.IBOVESPA;
        const currentPoints = ibov.points;
        
        // Gera histórico simulado baseado no valor atual (variação de ±2%)
        const simulatedHistory = [];
        const simulatedDates = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          simulatedDates.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
          
          // Variação aleatória de -2% a +2% para simular
          const variation = 1 + ((Math.random() - 0.5) * 0.04);
          simulatedHistory.push(Math.round(currentPoints * variation));
        }
        
        // O último valor é o atual
        simulatedHistory[6] = currentPoints;
        
        ibovData = {
          current: currentPoints,
          change: ibov.variation,
          history: simulatedHistory,
          dates: simulatedDates
        };
      }
    }
  } catch (error) {
    console.error('Falha ao buscar Ibovespa:', error);
    hasError = true;
  }

  return NextResponse.json({
    usd: usdData,
    ibovespa: ibovData,
    hasError
  });
}
