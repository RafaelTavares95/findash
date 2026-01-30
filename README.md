# FinDash 💰

Um dashboard financeiro moderno e elegante construído com Next.js, React, Redux e Bootstrap.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Redux](https://img.shields.io/badge/Redux-Toolkit-764ABC?logo=redux)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## ✨ Funcionalidades

### 📊 Dashboard Principal
- Visualização de dados de mercado (Dólar Comercial e Ibovespa)
- Insights e estratégias financeiras
- Interface responsiva e moderna
- Atualização automática de dados

### 💼 Controle Financeiro
- **Criação de Objetivos**: Defina metas financeiras personalizadas
- **Aportes**: Adicione valores aos seus objetivos
- **Acompanhamento Visual**: 
  - 🟢 **Verde** - Objetivo concluído (meta atingida)
  - 🔵 **Azul** - Em progresso (valor > 0)
  - ⚪ **Branco** - Não iniciado (valor = 0)
- **Barra de Progresso**: Visualize a evolução de cada objetivo
- **Importar/Exportar**: Backup e restauração de dados em JSON

### 🔐 Sistema de Usuários
- Login simples por nome
- Dados segregados por usuário
- Persistência local em JSON

### 🌐 Internacionalização (i18n)
- Suporte a Português (pt-BR) e Inglês (en-US)
- Detecção automática do idioma do navegador
- Seletor de idioma manual

## 🛠️ Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| **Next.js 15** | Framework React com App Router |
| **React 19** | Biblioteca de UI |
| **Redux Toolkit** | Gerenciamento de estado |
| **React Bootstrap** | Componentes de UI |
| **TypeScript** | Tipagem estática |
| **i18next** | Internacionalização |
| **Lucide React** | Ícones |
| **React Hot Toast** | Notificações |

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm, yarn, pnpm ou bun

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd findash

# Instale as dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
findash/
├── data/                    # Dados persistidos (JSON)
│   ├── reserves.json        # Objetivos financeiros
│   └── users.json           # Usuários cadastrados
├── src/
│   ├── app/                 # App Router (Next.js)
│   │   ├── api/             # API Routes
│   │   ├── control/         # Página de controle financeiro
│   │   ├── globals.css      # Estilos globais
│   │   └── page.tsx         # Dashboard principal
│   ├── components/          # Componentes React
│   │   ├── AuthGuard.tsx    # Proteção de rotas
│   │   ├── DataPersistence.tsx
│   │   ├── FinancialInput.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── Providers.tsx
│   ├── i18n/                # Configuração de idiomas
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   └── pt.json
│   │   └── index.ts
│   ├── services/            # Serviços externos
│   └── store/               # Redux Store
│       ├── slices/
│       │   ├── reservesSlice.ts
│       │   └── userSlice.ts
│       ├── hooks.ts
│       └── index.ts
└── public/                  # Assets públicos
```

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Executa o linter |

## 🎨 Design

O projeto utiliza um design moderno com:
- Gradientes suaves
- Glassmorphism
- Animações sutis
- Paleta de cores harmoniosa
- Totalmente responsivo

## 📄 Licença

Este projeto foi criado para fins de estudo e aprendizado.

---

Desenvolvido com ❤️ usando Next.js e React
