import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'market_history.json');

function getTodayStr() {
  return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
}

function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readHistory(): MarketHistoryData {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Erro ao ler histórico:', error);
  }
  return { usd: [], ibovespa: [], lastUpdated: '' };
}

function saveHistory(data: MarketHistoryData) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
  }
}

function updateHistoryArray(currentHistory: MarketHistoryItem[], currentValue: number): MarketHistoryItem[] {
  const today = getTodayStr();
  const history = [...currentHistory];
  
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

  const savedHistory = readHistory();
  let currentUsd = 0;
  let currentIbov = 0;

  // 1. Fetch USD
  try {
    const usdResponse = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (usdResponse.ok) {
      const json = await usdResponse.json();
      currentUsd = parseFloat(json.USDBRL.bid);
      const change = parseFloat(json.USDBRL.pctChange);
      
      usdData.current = currentUsd;
      usdData.change = change;
      
      // Se histórico local estiver vazio, tenta preencher com API (apenas na 1ª vez)
      if (savedHistory.usd.length === 0) {
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
    console.error('Erro fetching USD:', error);
    hasError = true;
  }

  // 2. Fetch Ibovespa
  try {
    const hgResponse = await fetch('https://api.hgbrasil.com/finance?format=json-cors&key=development', {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (hgResponse.ok) {
      const json = await hgResponse.json();
      if (json.results?.stocks?.IBOVESPA) {
        currentIbov = json.results.stocks.IBOVESPA.points;
        ibovData.current = currentIbov;
        ibovData.change = json.results.stocks.IBOVESPA.variation;
      }
    }
  } catch (error) {
    console.error('Erro fetching Ibov:', error);
    hasError = true;
  }

  // Atualiza histórico e salva
  if (currentUsd > 0) {
    savedHistory.usd = updateHistoryArray(savedHistory.usd, currentUsd);
  }
  if (currentIbov > 0) {
    savedHistory.ibovespa = updateHistoryArray(savedHistory.ibovespa, currentIbov);
  }
  
  if (currentUsd > 0 || currentIbov > 0) {
    savedHistory.lastUpdated = new Date().toISOString();
    saveHistory(savedHistory);
  }

  // Prepara resposta
  usdData.history = savedHistory.usd.map(item => item.value);
  usdData.dates = savedHistory.usd.map(item => item.date);
  
  ibovData.history = savedHistory.ibovespa.map(item => item.value);
  ibovData.dates = savedHistory.ibovespa.map(item => item.date);

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
