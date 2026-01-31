# 📚 Documentação Técnica - FinDash

> **Dashboard Financeiro construído com React, Next.js, Redux e Bootstrap**

Este documento explica em detalhes todas as decisões técnicas, arquitetura e tecnologias utilizadas no projeto FinDash. Ele foi criado com foco didático para ajudar no entendimento de como cada peça se encaixa.

---

## 📑 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Next.js - O Coração da Aplicação](#nextjs---o-coração-da-aplicação)
4. [Arquitetura de Pastas](#arquitetura-de-pastas)
5. [Gerenciamento de Estado com Redux](#gerenciamento-de-estado-com-redux)
6. [Sistema de Roteamento](#sistema-de-roteamento)
7. [API Routes](#api-routes)
8. [Sistema de Persistência de Dados](#sistema-de-persistência-de-dados)
9. [Autenticação](#autenticação)
10. [Internacionalização (i18n)](#internacionalização-i18n)
11. [Estilização](#estilização)
12. [Componentes Principais](#componentes-principais)
13. [Fluxo de Dados](#fluxo-de-dados)
14. [Decisões Técnicas e Trade-offs](#decisões-técnicas-e-trade-offs)

---

## 🎯 Visão Geral do Projeto

O **FinDash** é um dashboard financeiro pessoal que permite:

- 📈 **Visualizar dados de mercado**: Dólar comercial e índice Ibovespa em tempo real
- 💰 **Gerenciar reservas financeiras**: Criar metas de economia, adicionar valores e acompanhar o progresso
- 👤 **Sistema de usuários**: Cada usuário tem seus próprios dados isolados
- 🌍 **Suporte multilíngue**: Português e Inglês

---

## 🔧 Stack Tecnológico

### Dependências Principais

| Tecnologia | Versão | Função |
|------------|--------|--------|
| **Next.js** | 16.1.6 | Framework React com SSR/SSG |
| **React** | 19.2.3 | Biblioteca de UI |
| **Redux Toolkit** | 2.11.2 | Gerenciamento de estado global |
| **Bootstrap** | 5.3.8 | Framework CSS |
| **React-Bootstrap** | 2.10.10 | Componentes Bootstrap para React |
| **TypeScript** | 5.x | Tipagem estática |
| **i18next** | 25.8.0 | Internacionalização |
| **Chart.js** | 4.5.1 | Gráficos |
| **Lucide React** | 0.563.0 | Ícones |

### Por que essas escolhas?

1. **Next.js**: Oferece Server-Side Rendering, API Routes integradas e otimização automática
2. **Redux Toolkit**: Padrão simplificado para gerenciamento de estado complexo
3. **Bootstrap + React-Bootstrap**: Componentes prontos e responsivos, reduzindo tempo de desenvolvimento
4. **TypeScript**: Segurança de tipos, autocompletion e menos bugs em produção

---

## ⚡ Next.js - O Coração da Aplicação

### O que é Next.js?

Next.js é um **framework React** que adiciona funcionalidades que o React puro não oferece nativamente:

- **Server-Side Rendering (SSR)**: Páginas renderizadas no servidor
- **Static Site Generation (SSG)**: Páginas pré-geradas em build time
- **API Routes**: Backend integrado ao projeto
- **File-based Routing**: Rotas baseadas em estrutura de pastas
- **Otimizações automáticas**: Carregamento de imagens, code splitting, etc.

### App Router (Novo modelo do Next.js)

O FinDash usa o **App Router** (introduzido no Next.js 13+), que é diferente do antigo Pages Router.

#### Estrutura do App Router

```
src/app/
├── layout.tsx          # Layout raiz (envolve TODAS as páginas)
├── page.tsx            # Página inicial (/)
├── globals.css         # Estilos globais
├── client-layout.tsx   # Layout do cliente (com navegação)
├── control/
│   └── page.tsx        # Página /control
└── api/
    ├── auth/
    │   └── route.ts    # API endpoint /api/auth
    └── reserves/
        └── route.ts    # API endpoint /api/reserves
```

### Server Components vs Client Components

#### 🖥️ Server Components (Padrão)

Por padrão, **todos os componentes no App Router são Server Components**. Eles:

- Rodam **apenas no servidor**
- Não têm acesso a hooks como `useState`, `useEffect`
- Não podem usar eventos de browser (`onClick`, etc.)
- São ótimos para buscar dados e renderizar HTML estático

**Exemplo no projeto** - `layout.tsx`:

```typescript
// Este é um Server Component (não tem 'use client')
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { ClientLayout } from "./client-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinDash - Seu Dashboard Financeiro",
  description: "Acompanhe o dólar, ibovespa e suas reservas financeiras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body suppressHydrationWarning>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
```

**Pontos importantes**:

- `metadata` é uma funcionalidade **exclusiva de Server Components** - define SEO
- O `Providers` e `ClientLayout` são importados como Client Components

#### 💻 Client Components

Quando precisamos de interatividade, usamos a diretiva `'use client'`:

```typescript
'use client'; // <- Esta linha transforma em Client Component

import { useState, useEffect } from 'react';
// Agora podemos usar hooks e eventos do browser
```

**Exemplo no projeto** - `page.tsx` (Home):

```typescript
'use client';

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { getMarketData } from '@/store/slices/marketSlice';
import { useState, useEffect } from 'react';

export default function Home() {
  const dispatch = useAppDispatch();
  const { usd, ibovespa, lastUpdated, loading, error } = useAppSelector((state) => state.market);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    dispatch(getMarketData());
  }, [dispatch]);
  // ... resto do componente
}
```

**Por que usamos `'use client'` aqui?**

1. Precisamos do Redux (`useAppSelector`, `useAppDispatch`)
2. Usamos `useState` e `useEffect`
3. Temos eventos de click e interatividade

### Hierarquia de Renderização

```
┌─────────────────────────────────────────────────────────┐
│  RootLayout (Server Component)                          │
│  - Define HTML, metadata                                │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Providers (Client Component)                      │  │
│  │  - Redux Provider                                  │  │
│  │  - Bootstrap JS                                    │  │
│  │  - i18n                                            │  │
│  │  - Toast notifications                             │  │
│  │                                                    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  ClientLayout (Client Component)             │  │  │
│  │  │  - AuthGuard                                 │  │  │
│  │  │  - Sidebar navigation                        │  │  │
│  │  │  - Top bar                                   │  │  │
│  │  │  - DataPersistence                           │  │  │
│  │  │                                              │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │  Page Content (Client Component)       │  │  │  │
│  │  │  │  - Home ou Control page                │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Hydration - O que é?

**Hydration** é o processo onde o React "conecta" o JavaScript ao HTML que foi renderizado no servidor.

1. **Servidor**: Gera o HTML estático
2. **Browser**: Recebe o HTML (a página aparece instantaneamente)
3. **Hydration**: React "ativa" o HTML, adicionando event listeners e estado

**Problema comum**: Hydration Mismatch

Se o HTML do servidor for diferente do cliente, ocorre um erro. Por isso usamos:

```typescript
<body suppressHydrationWarning>
```

E também:

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

// Evita renderizar conteúdo dinâmico até estar no cliente
{mounted ? new Date(lastUpdated).toLocaleTimeString() : '---'}
```

---

## 📁 Arquitetura de Pastas

```
findash/
├── data/                    # Arquivos JSON de persistência local
│   ├── reserves.json        # Dados das reservas de todos os usuários
│   └── users.json           # Dados dos usuários registrados
│
├── public/                  # Arquivos estáticos (imagens, fonts)
│
├── src/
│   ├── app/                 # App Router do Next.js
│   │   ├── api/             # API Routes (backend)
│   │   │   ├── auth/
│   │   │   │   └── route.ts # POST /api/auth - login/registro
│   │   │   └── reserves/
│   │   │       └── route.ts # GET/POST /api/reserves - CRUD reservas
│   │   ├── control/
│   │   │   └── page.tsx     # Página de controle financeiro
│   │   ├── layout.tsx       # Layout raiz
│   │   ├── client-layout.tsx# Layout do cliente com navegação
│   │   ├── page.tsx         # Página inicial (dashboard)
│   │   ├── globals.css      # Estilos globais
│   │   └── page.module.css  # Estilos específicos da home
│   │
│   ├── components/          # Componentes reutilizáveis
│   │   ├── AuthGuard.tsx    # Proteção de rotas + tela de login
│   │   ├── DataPersistence.tsx # Sincronização de dados com API
│   │   ├── FinancialInput.tsx  # Input monetário formatado
│   │   ├── LanguageSwitcher.tsx# Troca de idioma
│   │   └── Providers.tsx    # Providers globais (Redux, Toast)
│   │
│   ├── i18n/                # Internacionalização
│   │   ├── index.ts         # Configuração do i18next
│   │   └── locales/
│   │       ├── en.json      # Traduções em inglês
│   │       └── pt.json      # Traduções em português
│   │
│   ├── lib/                 # Utilitários e helpers
│   │   ├── storage.ts       # Abstração de storage (local/Vercel Blob)
│   │   └── jsonStorage.ts   # Helper para JSON local
│   │
│   ├── services/            # Serviços externos
│   │   └── marketService.ts # Busca dados do dólar e Ibovespa
│   │
│   └── store/               # Redux Store
│       ├── index.ts         # Configuração da store
│       ├── hooks.ts         # Hooks tipados do Redux
│       └── slices/
│           ├── marketSlice.ts   # Estado dos dados de mercado
│           ├── reservesSlice.ts # Estado das reservas financeiras
│           └── userSlice.ts     # Estado do usuário logado
│
├── next.config.ts           # Configuração do Next.js
├── tsconfig.json            # Configuração do TypeScript
└── package.json             # Dependências e scripts
```

---

## 🗃️ Gerenciamento de Estado com Redux

### Por que Redux?

Embora o React tenha Context API, o **Redux Toolkit** oferece:

- **DevTools**: Debug visual do estado
- **Middleware**: Para efeitos colaterais (async thunks)
- **Imutabilidade**: Integrado com Immer
- **Padrão previsível**: Actions > Reducers > State

### Configuração da Store

**`src/store/index.ts`**:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import marketReducer from './slices/marketSlice';
import reservesReducer from './slices/reservesSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    market: marketReducer,      // Estado dos dados de mercado
    reserves: reservesReducer,  // Estado das reservas
    user: userReducer,          // Estado do usuário
  },
});

// Tipos para TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Hooks Tipados

**`src/store/hooks.ts`**:

```typescript
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Hooks com tipos corretos
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

**Por que criar esses hooks?**

O TypeScript precisa saber os tipos exatos do estado e do dispatch. Esses hooks tipados evitam ter que fazer casting manual em cada componente.

### Slices

#### MarketSlice - Dados de Mercado

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchMarketData, MarketData } from '@/services/marketService';

interface MarketState {
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
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

// Async Thunk - busca dados externos
export const getMarketData = createAsyncThunk(
  'market/fetchData',
  async () => {
    const data = await fetchMarketData();
    return data;
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    updateMarketData: (state, action: PayloadAction<Partial<MarketState>>) => {
      return { ...state, ...action.payload, lastUpdated: new Date().toISOString() };
    },
  },
  // Handlers para o async thunk
  extraReducers: (builder) => {
    builder
      .addCase(getMarketData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMarketData.fulfilled, (state, action) => {
        state.loading = false;
        state.usd = action.payload.usd;
        state.ibovespa = action.payload.ibovespa;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getMarketData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar dados';
      });
  },
});
```

**Conceitos importantes**:

1. **`createAsyncThunk`**: Cria uma action que lida com promises (pending, fulfilled, rejected)
2. **`extraReducers`**: Responde a actions geradas por thunks
3. **`PayloadAction<T>`**: Tipo que define o formato do payload

#### ReservesSlice - Reservas Financeiras

```typescript
export interface ReserveSlot {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  history: ReserveHistory[];
}

const reservesSlice = createSlice({
  name: 'reserves',
  initialState: { slots: [] as ReserveSlot[] },
  reducers: {
    addSlot: (state, action: PayloadAction<Omit<ReserveSlot, 'id' | 'currentAmount' | 'history'>>) => {
      const newSlot: ReserveSlot = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        currentAmount: 0,
        history: [{ date: new Date().toISOString().split('T')[0], amount: 0 }],
      };
      state.slots.push(newSlot);
    },
    addValueToSlot: (state, action: PayloadAction<{ id: string; amount: number }>) => {
      const slot = state.slots.find((s) => s.id === action.payload.id);
      if (slot) {
        slot.currentAmount += action.payload.amount;
        slot.history.push({
          date: new Date().toISOString().split('T')[0],
          amount: slot.currentAmount,
        });
      }
    },
    removeSlot: (state, action: PayloadAction<string>) => {
      state.slots = state.slots.filter((s) => s.id !== action.payload);
    },
    setSlots: (state, action: PayloadAction<ReserveSlot[]>) => {
      state.slots = action.payload;
    },
  },
});
```

**Note o uso de Immer**: O Redux Toolkit usa Immer internamente, permitindo "mutações" no estado que são traduzidas para operações imutáveis.

---

## 🛣️ Sistema de Roteamento

### File-based Routing

No App Router, a estrutura de pastas define as rotas:

| Pasta | URL |
|-------|-----|
| `src/app/page.tsx` | `/` |
| `src/app/control/page.tsx` | `/control` |
| `src/app/api/auth/route.ts` | `/api/auth` |
| `src/app/api/reserves/route.ts` | `/api/reserves` |

### Navegação

Usamos o componente `Link` do Next.js:

```typescript
import Link from "next/link";

<Link href="/" className="nav-link">
  Dashboard
</Link>

<Link href="/control" className="nav-link">
  Controle
</Link>
```

### Hook usePathname

Para detectar a rota atual:

```typescript
import { usePathname } from 'next/navigation';

const pathname = usePathname();

// Aplicar classe 'active' na rota atual
<Link 
  href="/" 
  className={`nav-link ${pathname === '/' ? 'active' : ''}`}
>
  Dashboard
</Link>
```

---

## 🔌 API Routes

### O que são API Routes?

São funções serverless que rodam no backend, diretamente no projeto Next.js. Não precisamos de um servidor separado!

### Estrutura

```typescript
// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';

// Métodos HTTP são funções exportadas
export async function POST(request: Request) {
  const { name } = await request.json();
  
  // Lógica de backend...
  
  return NextResponse.json({ id: '123', name });
}

export async function GET(request: Request) {
  // ...
}
```

### API de Autenticação (`/api/auth`)

```typescript
export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Lê usuários existentes
    const users = await readJson<any[]>(USERS_FILE, []);

    // Verifica se já existe (case insensitive)
    let user = users.find((u) => 
      u?.name?.toLowerCase() === name.toLowerCase()
    );

    if (!user) {
      // Cria novo usuário com UUID
      user = {
        id: randomUUID(),
        name: name,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      await writeJson(USERS_FILE, users);
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
```

### API de Reservas (`/api/reserves`)

```typescript
// GET - Busca reservas do usuário
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const allReserves = await readJson<any[]>(RESERVES_FILE, []);
  const userReserves = allReserves.filter((res) => res.userId === userId);
    
  return NextResponse.json(userReserves);
}

// POST - Salva reservas do usuário
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  const userReserves = await request.json();
  const allReserves = await readJson<any[]>(RESERVES_FILE, []);

  // Remove reservas antigas do usuário
  const otherUsersReserves = allReserves.filter((res) => res.userId !== userId);
    
  // Adiciona userId a cada reserva
  const reservesWithId = userReserves.map((res) => ({
    ...res,
    userId: userId
  }));

  const updatedReserves = [...otherUsersReserves, ...reservesWithId];
  
  await writeJson(RESERVES_FILE, updatedReserves);
  return NextResponse.json({ success: true });
}
```

---

## 💾 Sistema de Persistência de Dados

### Estratégia Dual

O projeto usa uma abstração que funciona de forma diferente em desenvolvimento e produção:

```typescript
// src/lib/storage.ts

// Detecta ambiente
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function readJson<T>(fileName: string, defaultValue: T): Promise<T> {
  if (isProduction && BLOB_READ_WRITE_TOKEN) {
    return readFromBlob<T>(fileName, defaultValue);  // Vercel Blob Storage
  } else {
    return readFromFile<T>(fileName, defaultValue);  // Arquivo local
  }
}

export async function writeJson<T>(fileName: string, data: T): Promise<void> {
  if (isProduction && BLOB_READ_WRITE_TOKEN) {
    await writeToBlob(fileName, data);
  } else {
    await writeToFile(fileName, data);
  }
}
```

### Desenvolvimento (Local)

Salva em arquivos JSON na pasta `data/`:

```typescript
async function readFromFile<T>(fileName: string, defaultValue: T): Promise<T> {
  const filePath = path.join(process.cwd(), 'data', fileName);
  
  // Cria diretório se não existir
  ensureDirectory(filePath);

  if (!fs.existsSync(filePath)) {
    // Cria arquivo com valor padrão
    await fs.promises.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
    return defaultValue;
  }

  const data = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(data) as T;
}
```

### Produção (Vercel Blob)

Usa o Vercel Blob Storage para persistir dados na nuvem:

```typescript
async function readFromBlob<T>(fileName: string, defaultValue: T): Promise<T> {
  const { blobs } = await list({
    prefix: fileName,
    token: BLOB_READ_WRITE_TOKEN,
  });

  if (blobs.length === 0) {
    await writeToBlob(fileName, defaultValue);
    return defaultValue;
  }

  const blob = blobs[0];
  const response = await fetch(blob.url);
  const text = await response.text();
  
  return JSON.parse(text) as T;
}
```

### Componente DataPersistence

Sincroniza automaticamente o Redux com a API:

```typescript
export function DataPersistence() {
  const dispatch = useDispatch();
  const slots = useSelector((state: RootState) => state.reserves.slots);
  const user = useSelector((state: RootState) => state.user.currentUser);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Carrega dados quando usuário muda
  useEffect(() => {
    if (!user) {
      dispatch(setSlots([]));
      return;
    }

    const loadData = async () => {
      const response = await fetch(`/api/reserves?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          dispatch(setSlots(data));
        }
      }
      setHasLoaded(true);
    };

    loadData();
  }, [dispatch, user]);

  // Salva dados quando mudam (com debounce)
  useEffect(() => {
    if (!hasLoaded || !user) return;

    const saveData = async () => {
      await fetch(`/api/reserves?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slots),
      });
    };

    const timeoutId = setTimeout(saveData, 500); // Debounce de 500ms
    return () => clearTimeout(timeoutId);
  }, [slots, hasLoaded, user]);

  return null; // Componente invisível
}
```

---

## 🔐 Autenticação

### Fluxo Simplificado

O sistema usa autenticação baseada em nome (sem senha), ideal para estudo:

1. Usuário digita seu nome
2. Sistema verifica se já existe no `users.json`
3. Se não existe, cria novo usuário com UUID
4. Salva no `localStorage` para persistir sessão

### AuthGuard Component

```typescript
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((state) => state.user.currentUser);
  const dispatch = useAppDispatch();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Carrega usuário do localStorage
    const savedUser = localStorage.getItem('findash_user');
    if (savedUser && !user) {
      dispatch(setUser(JSON.parse(savedUser)));
    }
    setIsMounted(true);
  }, [dispatch, user]);

  // Evita hydration mismatch
  if (!isMounted) {
    return <LoadingSpinner />;
  }

  // Se não estiver logado, mostra tela de login
  if (!user) {
    return <LoginScreen />;
  }

  // Se estiver logado, renderiza conteúdo
  return <>{children}</>;
}
```

### Fluxo de Login

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // Chama API de autenticação
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tempName.trim() }),
    });
    
    if (response.ok) {
      const userData = await response.json();
      dispatch(setUser(userData)); // Salva no Redux e localStorage
    }
  } catch (error) {
    alert('Erro de conexão');
  } finally {
    setLoading(false);
  }
};
```

---

## 🌍 Internacionalização (i18n)

### Configuração

**`src/i18n/index.ts`**:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import ptTranslations from './locales/pt.json';

i18n
  .use(LanguageDetector)      // Detecta idioma do navegador
  .use(initReactI18next)       // Integração com React
  .init({
    resources: {
      en: { translation: enTranslations },
      pt: { translation: ptTranslations }
    },
    fallbackLng: 'en',         // Idioma padrão se detecção falhar
    interpolation: {
      escapeValue: false       // React já escapa por padrão
    },
    detection: {
      order: ['localStorage', 'navigator'], // Prioridade de detecção
      caches: ['localStorage']              // Onde salvar preferência
    }
  });
```

### Uso nos Componentes

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('common.dashboard')}</h1>
      <p>{t('common.welcome_message')}</p>
      
      {/* Formatação baseada no idioma */}
      {formatCurrency(value, i18n.language)}
    </div>
  );
}
```

### Component LanguageSwitcher

```typescript
export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('pt') ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  return (
    <button onClick={toggleLanguage}>
      {i18n.language.startsWith('pt') ? '🇧🇷' : '🇺🇸'}
    </button>
  );
}
```

---

## 🎨 Estilização

### Abordagem Híbrida

O projeto combina:

1. **Bootstrap** - Grid system, componentes base
2. **CSS personalizado** - Customizações em `globals.css`
3. **Styled JSX** - Estilos inline em componentes específicos

### Design System (CSS Variables)

```css
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #818cf8;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --background: #f8fafc;
  --surface: #ffffff;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --radius-lg: 1.25rem;
  --radius-md: 0.75rem;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Componentes Customizados

```css
/* Cards com hover effect */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl) !important;
  border-color: var(--primary-light);
}

/* Glass morphism */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Botão primário com gradiente */
.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border: none;
  box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39);
}
```

---

## 🧩 Componentes Principais

### 1. Providers

Envolve toda a aplicação com os contextos necessários:

```typescript
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Bootstrap JS apenas no cliente
    require('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <Provider store={store}>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />
      {children}
    </Provider>
  );
}
```

### 2. ClientLayout

Layout principal com navegação:

- Sidebar para desktop
- Header para mobile
- DataPersistence para sincronização

### 3. AuthGuard

Protege rotas e gerencia autenticação

### 4. FinancialInput

Input especializado para valores monetários:

```typescript
export default function FinancialInput({ label, onValueChange, ...props }) {
  const { i18n } = useTranslation();
  
  return (
    <Form.Group>
      <Form.Label>{label}</Form.Label>
      <CurrencyInput
        intlConfig={{ 
          locale: i18n.language.startsWith('pt') ? 'pt-BR' : 'en-US', 
          currency: i18n.language.startsWith('pt') ? 'BRL' : 'USD' 
        }}
        decimalSeparator={i18n.language.startsWith('pt') ? ',' : '.'}
        groupSeparator={i18n.language.startsWith('pt') ? '.' : ','}
        onValueChange={onValueChange}
        {...props}
      />
    </Form.Group>
  );
}
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE DADOS                               │
└─────────────────────────────────────────────────────────────────────┘

1. USUÁRIO FAZ LOGIN
   ┌─────────┐    POST /api/auth    ┌─────────────┐
   │ Browser │ ──────────────────── │ API Route   │
   └────┬────┘                      │ (route.ts)  │
        │                           └──────┬──────┘
        │                                  │
        │                           ┌──────▼──────┐
        │                           │ users.json  │
        │                           └──────┬──────┘
        │                                  │
        │ ◄────────────────────────────────┘
        ▼         Response: { id, name }
   ┌─────────┐
   │ Redux   │
   │ (user)  │
   └────┬────┘
        │
        ▼
   ┌─────────────────┐
   │ localStorage    │
   │ findash_user    │
   └─────────────────┘

2. CARREGA RESERVAS
   ┌─────────────────┐  GET /api/reserves?userId=xxx  ┌─────────────┐
   │ DataPersistence │ ────────────────────────────── │ API Route   │
   └────────┬────────┘                                └──────┬──────┘
            │                                                │
            │                                         ┌──────▼──────┐
            │                                         │reserves.json│
            │                                         └──────┬──────┘
            │                                                │
            │ ◄──────────────────────────────────────────────┘
            ▼               Response: [...]
   ┌─────────┐
   │ Redux   │
   │(reserves)│
   └────┬────┘
        │
        ▼
   ┌────────────────┐
   │ UI Components  │
   │ (re-render)    │
   └────────────────┘

3. USUÁRIO ADICIONA RESERVA
   ┌────────────┐   dispatch(addSlot)   ┌─────────┐
   │ Component  │ ───────────────────── │ Redux   │
   └────────────┘                       │(reserves)│
                                        └────┬────┘
                                             │
   ┌─────────────────────────────────────────┘
   │ useEffect em DataPersistence detecta mudança
   ▼
   ┌─────────────────┐  POST /api/reserves   ┌─────────────┐
   │ DataPersistence │ ───────────────────── │ API Route   │
   └─────────────────┘     (debounced)       └──────┬──────┘
                                                    │
                                             ┌──────▼──────┐
                                             │reserves.json│
                                             └─────────────┘
```

---

## 🤔 Decisões Técnicas e Trade-offs

### 1. Por que Next.js ao invés de Create React App?

| CRA | Next.js |
|-----|---------|
| Apenas SPA | SSR, SSG, SPA |
| Sem backend | API Routes integradas |
| Configuração manual | Convenções prontas |
| Sem otimizações | Image optimization, code splitting |

**Decisão**: Next.js foi escolhido para aprender o ecossistema moderno React com recursos avançados.

### 2. Por que Redux ao invés de Context API?

| Context API | Redux Toolkit |
|-------------|---------------|
| Simples para estados pequenos | Melhor para estados complexos |
| Re-renders em cascata | Seletores otimizados |
| Sem DevTools | DevTools poderosas |
| Sem middleware | Thunks, sagas, etc. |

**Decisão**: Redux Toolkit para aprender gerenciamento de estado robusto.

### 3. Por que autenticação simples (sem senha)?

**Trade-off**: 
- ✅ Simplicidade para projeto de estudo
- ✅ Foco em aprender outras tecnologias
- ❌ Não é seguro para produção real

**Decisão**: Autenticação real seria uma distração. O foco é Next.js + Redux.

### 4. Por que persistência dual (local + Vercel Blob)?

**Trade-off**:
- ✅ Desenvolvimento: arquivos locais são mais rápidos para debug
- ✅ Produção: Vercel Blob é serverless e escalável
- ❌ Mais código para manter

**Decisão**: Flexibilidade entre ambientes justifica a complexidade.

### 5. Por que Bootstrap + React-Bootstrap?

**Trade-off**:
- ✅ Componentes prontos e responsivos
- ✅ Curva de aprendizado menor
- ❌ Bundle maior que alternativas como Tailwind

**Decisão**: Velocidade de desenvolvimento e familiaridade.

---

## 📝 Conclusão

O **FinDash** é um projeto que demonstra como integrar diversas tecnologias modernas do ecossistema React:

- **Next.js** como framework full-stack
- **Redux Toolkit** para gerenciamento de estado
- **API Routes** para backend serverless
- **TypeScript** para segurança de tipos
- **i18next** para internacionalização
- **Bootstrap** para UI responsiva

Cada decisão foi tomada pensando no equilíbrio entre:
- 📚 Valor educacional
- ⚡ Produtividade
- 🔧 Manutenibilidade

---

> **Dica de estudo**: Experimente modificar cada parte do código para entender como elas se conectam. Comece pelos slices do Redux, depois vá para as API Routes, e por fim os componentes React.

---

*Documentação criada em 30 de Janeiro de 2026*
