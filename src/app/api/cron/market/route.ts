import { readJson, writeJson } from '@/lib/storage';

// Esta rota é chamada pelo Vercel Cron Job
// Configuração no vercel.json

interface MarketHistoryItem {
  date: string;
  value: number;
}

interface MarketHistoryData {
  usd: MarketHistoryItem[];
  ibovespa: MarketHistoryItem[];
  lastUpdated: string;
}

const HISTORY_FILE = 'market_history.json';

function getTodayStr() {
  return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
}

function updateHistoryArray(currentHistory: MarketHistoryItem[], currentValue: number): MarketHistoryItem[] {
  const today = getTodayStr();
  const history = Array.isArray(currentHistory) ? [...currentHistory] : [];
  
  const existingIndex = history.findIndex(item => item.date === today);
  
  if (existingIndex >= 0) {
    history[existingIndex].value = currentValue;
  } else {
    history.push({ date: today, value: currentValue });
  }
  
  if (history.length > 7) {
    return history.slice(history.length - 7);
  }
  
  return history;
}

export async function GET(request: Request) {
  // Verifica se é uma chamada autorizada do Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Em desenvolvimento, permite sem autenticação
    if (process.env.NODE_ENV === 'production') {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const defaultHistory: MarketHistoryData = { usd: [], ibovespa: [], lastUpdated: '' };
  const savedHistory = await readJson<MarketHistoryData>(HISTORY_FILE, defaultHistory);

  let currentUsd = 0;
  let currentIbov = 0;

  try {
    const hgResponse = await fetch('https://api.hgbrasil.com/finance?format=json-cors&key=development', {
      cache: 'no-store'
    });
    
    if (hgResponse.ok) {
      const hgJson = await hgResponse.json();
      
      if (hgJson.results?.currencies?.USD) {
        currentUsd = hgJson.results.currencies.USD.buy || 0;
      }
      
      if (hgJson.results?.stocks?.IBOVESPA) {
        currentIbov = hgJson.results.stocks.IBOVESPA.points || 0;
      }
    }
  } catch (error) {
    console.error('[Cron] Erro ao buscar dados de mercado:', error);
    return Response.json({ success: false, error: 'Falha ao buscar dados' }, { status: 500 });
  }

  // Atualiza histórico
  if (currentUsd > 0) {
    savedHistory.usd = updateHistoryArray(savedHistory.usd, currentUsd);
  }
  
  if (currentIbov > 0) {
    savedHistory.ibovespa = updateHistoryArray(savedHistory.ibovespa, currentIbov);
  }

  savedHistory.lastUpdated = new Date().toISOString();
  
  try {
    await writeJson(HISTORY_FILE, savedHistory);
  } catch (e) {
    console.error('[Cron] Erro ao salvar no storage:', e);
    return Response.json({ success: false, error: 'Falha ao salvar dados' }, { status: 500 });
  }

  console.log('[Cron] Histórico de mercado atualizado com sucesso:', {
    usd: currentUsd,
    ibovespa: currentIbov,
    date: getTodayStr()
  });

  return Response.json({ 
    success: true, 
    message: 'Histórico atualizado',
    data: {
      usd: currentUsd,
      ibovespa: currentIbov,
      usdHistoryLength: savedHistory.usd.length,
      ibovHistoryLength: savedHistory.ibovespa.length
    }
  });
}
