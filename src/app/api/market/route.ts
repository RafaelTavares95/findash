import { NextResponse } from 'next/server';

export async function GET() {
  let usdData = { current: 5.42, change: 0.15, history: [5.38, 5.40, 5.41, 5.42] };
  let ibovData = { current: 128500, change: -0.45, history: [129200, 129000, 128800, 128500] };
  let hasError = false;

  // 1. Fetch USD from AwesomeAPI
  try {
    const usdResponse = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
      next: { revalidate: 60 } // Cache por 60 segundos
    });
    
    if (usdResponse.ok) {
      const usdJson = await usdResponse.json();
      const usd = usdJson.USDBRL;
      usdData = {
        current: parseFloat(usd.bid),
        change: parseFloat(usd.pctChange),
        history: [5.38, 5.40, 5.41, parseFloat(usd.bid)],
      };
    }
  } catch (error) {
    console.error('Falha ao buscar USD:', error);
    hasError = true;
  }

  // 2. Fetch Ibovespa from HG Brasil (no servidor, não há problema de CORS)
  try {
    const hgResponse = await fetch('https://api.hgbrasil.com/finance?format=json-cors&key=development', {
      next: { revalidate: 60 } // Cache por 60 segundos
    });
    
    if (hgResponse.ok) {
      const hgJson = await hgResponse.json();
      if (hgJson.results && hgJson.results.stocks && hgJson.results.stocks.IBOVESPA) {
        const ibov = hgJson.results.stocks.IBOVESPA;
        ibovData = {
          current: ibov.points,
          change: ibov.variation,
          history: [129200, 129000, 128800, ibov.points],
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
