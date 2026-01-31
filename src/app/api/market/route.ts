import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HistoricalUSD {
  bid: string;
  timestamp: string;
}

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
  // Garante que currentHistory seja um array (pode vir indefinido do JSON antigo)
  const history = Array.isArray(currentHistory) ? [...currentHistory] : [];
  
  const existingIndex = history.findIndex(item => item.date === today);
  
  if (existingIndex >= 0) {
    // Atualiza o valor de hoje
    history[existingIndex].value = currentValue;
  } else {
    // Adiciona novo valor
    history.push({ date: today, value: currentValue });
  }
  
  // Mantém apenas os últimos 7 dias
  if (history.length > 7) {
    return history.slice(history.length - 7);
  }
  
  return history;
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

  // Carrega histórico persistido (Blob ou Local)
  const defaultHistory: MarketHistoryData = { usd: [], ibovespa: [], lastUpdated: '' };
  const savedHistory = await readJson<MarketHistoryData>(HISTORY_FILE, defaultHistory);
  
  let currentUsd = 0;
  let currentIbov = 0;

  // 1. Fetch USD
  try {
    const usdResponse = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    if (usdResponse.ok) {
      const json = await usdResponse.json();
      currentUsd = parseFloat(json.USDBRL.bid);
      const change = parseFloat(json.USDBRL.pctChange);
      
      usdData.current = currentUsd;
      usdData.change = change;
      
      // Se histórico local estiver vazio, tenta preencher com API
      if (!savedHistory.usd || savedHistory.usd.length === 0) {
        try {
          const histResponse = await fetch('https://economia.awesomeapi.com.br/json/daily/USD-BRL/7');
          if (histResponse.ok) {
            const histJson: HistoricalUSD[] = await histResponse.json();
             const sorted = histJson.reverse();
             savedHistory.usd = sorted.map(item => ({
               date: new Date(parseInt(item.timestamp) * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
               value: parseFloat(item.bid)
             }));
          }
        } catch (e) { console.error('Erro seeding inicial USD:', e); }
      }
    }
  } catch (error) {
    console.error('Falha ao buscar USD:', error);
    hasError = true;
  }

  // 2. Fetch Ibovespa
  try {
    const hgResponse = await fetch('https://api.hgbrasil.com/finance?format=json-cors&key=development');
    if (hgResponse.ok) {
      const hgJson = await hgResponse.json();
      if (hgJson.results && hgJson.results.stocks && hgJson.results.stocks.IBOVESPA) {
        const ibov = hgJson.results.stocks.IBOVESPA;
        currentIbov = ibov.points;
        
        ibovData.current = currentIbov;
        ibovData.change = ibov.variation;
      }
    }
  } catch (error) {
    console.error('Falha ao buscar Ibovespa (HG):', error);
    hasError = true;
  }

  // Atualiza histórico e salva se houver novos dados
  let shouldSave = false;
  
  if (currentUsd > 0) {
    const newUsdHistory = updateHistoryArray(savedHistory.usd, currentUsd);
    // Verifica se mudou algo para evitar writes desnecessários (opcional, mas bom pra Blob)
    if (JSON.stringify(newUsdHistory) !== JSON.stringify(savedHistory.usd)) {
      savedHistory.usd = newUsdHistory;
      shouldSave = true;
    }
  }
  
  if (currentIbov > 0) {
    const newIbovHistory = updateHistoryArray(savedHistory.ibovespa, currentIbov);
    if (JSON.stringify(newIbovHistory) !== JSON.stringify(savedHistory.ibovespa)) {
      savedHistory.ibovespa = newIbovHistory;
      shouldSave = true;
    }
  }

  if (shouldSave) {
    savedHistory.lastUpdated = new Date().toISOString();
    try {
      await writeJson(HISTORY_FILE, savedHistory);
    } catch (e) {
      console.error('Erro ao salvar no storage:', e);
    }
  }

  // Prepara resposta garantindo arrays
  const safeUsdHist = savedHistory.usd || [];
  const safeIbovHist = savedHistory.ibovespa || [];

  usdData.history = safeUsdHist.map(item => item.value);
  usdData.dates = safeUsdHist.map(item => item.date);
  
  ibovData.history = safeIbovHist.map(item => item.value);
  ibovData.dates = safeIbovHist.map(item => item.date);

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
