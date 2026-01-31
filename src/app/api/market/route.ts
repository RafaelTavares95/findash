import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  let usdChange = 0;
  let ibovChange = 0;

  // Fetch dados da HG Brasil (única fonte para USD e Ibovespa)
  try {
    const hgResponse = await fetch('https://api.hgbrasil.com/finance?format=json-cors&key=development', {
      cache: 'no-store'
    });
    
    if (hgResponse.ok) {
      const hgJson = await hgResponse.json();
      
      // Extrai dados do USD
      if (hgJson.results?.currencies?.USD) {
        const usd = hgJson.results.currencies.USD;
        currentUsd = usd.buy || 0;
        usdChange = usd.variation || 0;
        
        usdData.current = currentUsd;
        usdData.change = usdChange;
      }
      
      // Extrai dados do Ibovespa
      if (hgJson.results?.stocks?.IBOVESPA) {
        const ibov = hgJson.results.stocks.IBOVESPA;
        currentIbov = ibov.points || 0;
        ibovChange = ibov.variation || 0;
        
        ibovData.current = currentIbov;
        ibovData.change = ibovChange;
      }
    } else {
      console.error('Falha ao buscar dados HG Brasil:', hgResponse.status, hgResponse.statusText);
      hasError = true;
    }
  } catch (error) {
    console.error('Erro ao buscar dados de mercado (HG Brasil):', error);
    hasError = true;
  }

  // Atualiza histórico e salva se houver novos dados
  let shouldSave = false;
  
  if (currentUsd > 0) {
    const newUsdHistory = updateHistoryArray(savedHistory.usd, currentUsd);
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
