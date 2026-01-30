'use client';

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { getMarketData } from '@/store/slices/marketSlice';
import { TrendingDown, TrendingUp, DollarSign, BarChart3, Clock, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const dispatch = useAppDispatch();
  const { usd, ibovespa, lastUpdated, loading, error } = useAppSelector((state) => state.market);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
    dispatch(getMarketData());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getMarketData());
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 14 },
        displayColors: false,
      },
    },
    scales: {
      x: { 
        display: true,
        grid: { display: false },
        ticks: { 
          font: { size: 10 },
          color: '#94a3b8',
          maxRotation: 0,
        },
      },
      y: { display: false },
    },
  };

  // Fallback para quando os dados ainda não carregaram
  const usdHistory = usd.history?.length ? usd.history : [0];
  const usdDates = usd.dates?.length ? usd.dates : ['--'];
  const ibovHistory = ibovespa.history?.length ? ibovespa.history : [0];
  const ibovDates = ibovespa.dates?.length ? ibovespa.dates : ['--'];

  const usdData = {
    labels: usdDates,
    datasets: [
      {
        label: 'Dólar (R$)',
        data: usdHistory,
        borderColor: '#6366f1',
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const ibovData = {
    labels: ibovDates,
    datasets: [
      {
        label: 'Ibovespa (pts)',
        data: ibovHistory,
        borderColor: '#10b981',
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 tracking-tight">{t('common.market_overview')}</h2>
          <p className="text-muted d-flex align-items-center gap-2 mb-0">
            <Clock size={16} className="text-primary" /> 
            <span className="small">{t('common.last_updated')}: {mounted ? new Date(lastUpdated).toLocaleTimeString() : '---'}</span>
          </p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-lg border-0"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          <span>{loading ? t('common.syncing') : t('common.sync_now')}</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-warning border-0 shadow-sm mb-5 d-flex align-items-center gap-3 p-3 animate-in" style={{ borderRadius: 'var(--radius-md)' }}>
          <div className="bg-warning bg-opacity-20 p-2 rounded-circle">
            <TrendingDown size={20} className="text-warning" />
          </div>
          <div>
            <div className="fw-bold">{t('common.system_note')}</div>
            <div className="small opacity-75">{error}. {t('common.simulated_data')}</div>
          </div>
        </div>
      )}

      <div className="row g-4 mb-5">
        {/* USD Card */}
        <div className="col-12 col-xl-6">
          <div className="card h-100 border-0 shadow-sm stat-card-glow-primary p-2">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-4 text-primary shadow-sm">
                    <DollarSign size={28} />
                  </div>
                  <div>
                    <h6 className="text-muted text-uppercase smaller fw-800 tracking-widest mb-1">{t('common.commercial_dollar')}</h6>
                    <div className="d-flex align-items-center gap-2">
                      <h2 className="fw-900 mb-0">R$ {usd.current.toFixed(2)}</h2>
                      <span className={`badge ${usd.change >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${usd.change >= 0 ? 'text-success' : 'text-danger'} border-0 rounded-pill px-2 py-1 small`}>
                        {usd.change >= 0 ? '+' : ''}{usd.change}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ height: '150px', margin: '0 -10px' }}>
                <Line options={chartOptions} data={usdData} />
              </div>
            </div>
          </div>
        </div>

        {/* IBOVESPA Card */}
        <div className="col-12 col-xl-6">
          <div className="card h-100 border-0 shadow-sm p-2">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 p-3 rounded-4 text-success shadow-sm">
                    <BarChart3 size={28} />
                  </div>
                  <div>
                    <h6 className="text-muted text-uppercase smaller fw-800 tracking-widest mb-1">{t('common.ibovespa')}</h6>
                    <div className="d-flex align-items-center gap-2">
                      <h2 className="fw-900 mb-0">{ibovespa.current.toLocaleString()} pts</h2>
                      <span className={`badge ${ibovespa.change >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${ibovespa.change >= 0 ? 'text-success' : 'text-danger'} border-0 rounded-pill px-2 py-1 small`}>
                        {ibovespa.change >= 0 ? '+' : ''}{ibovespa.change}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ height: '150px', margin: '0 -10px' }}>
                <Line options={chartOptions} data={ibovData} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="glass-card p-4 p-md-5 border-0 shadow-lg">
            <div className="d-flex align-items-center gap-2 mb-4">
              <div className="bg-primary rounded-3 p-1">
                <TrendingUp size={16} className="text-white" />
              </div>
              <h5 className="fw-bold mb-0">{t('common.insights_strategies')}</h5>
            </div>
            
            <div className="row g-4">
              {[
                { 
                  icon: <TrendingUp className="text-success" />, 
                  title: t('common.opportunity_title'), 
                  desc: t('common.opportunity_desc'),
                  bgColor: "bg-success"
                },
                { 
                  icon: <TrendingDown className="text-danger" />, 
                  title: t('common.caution_title'), 
                  desc: t('common.caution_desc'),
                  bgColor: "bg-danger"
                },
                { 
                  icon: <DollarSign className="text-primary" />, 
                  title: t('common.reserve_title'), 
                  desc: t('common.reserve_desc'),
                  bgColor: "bg-primary"
                }
              ].map((tip, i) => (
                <div className="col-md-4" key={i}>
                  <div className="p-4 border border-light rounded-4 h-100 transition-all bg-white">
                    <div className={`${tip.bgColor} bg-opacity-10 p-2 rounded-3 d-inline-block mb-3`}>
                      {tip.icon}
                    </div>
                    <h6 className="fw-bold mb-2">{tip.title}</h6>
                    <p className="small text-muted mb-0 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

