'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';
import { User, LogIn, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import '@/i18n';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((state) => state.user.currentUser);
  const dispatch = useAppDispatch();
  const [tempName, setTempName] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem('findash_user');
    if (savedUser && !user) {
      try {
        dispatch(setUser(JSON.parse(savedUser)));
      } catch (e) {
        localStorage.removeItem('findash_user');
      }
    }
    setIsMounted(true);
  }, [dispatch, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setLoading(true);
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tempName.trim() }),
        });
        
        if (response.ok) {
          const userData = await response.json();
          dispatch(setUser(userData));
        } else {
          const errorData = await response.json();
          console.error('Login failed:', errorData);
          alert(`${t('common.login_error')}: ${errorData.details || errorData.error || '?'}`);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert(t('common.connection_error'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Prevent hydration mismatch by not rendering anything until mounted
  if (!isMounted) {
    return (
      <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-dark p-4">
        <div className="mb-4 d-flex justify-content-end w-100" style={{ maxWidth: '450px' }}>
          <div className="bg-dark bg-opacity-50 p-1 rounded-3">
            <LanguageSwitcher />
          </div>
        </div>
        <div className="glass-card p-5 border-0 shadow-2xl rounded-5 text-center" style={{ maxWidth: '450px', width: '100%', background: 'rgba(30, 41, 59, 0.7)' }}>
          <div className="bg-primary bg-opacity-10 rounded-4 p-4 d-inline-block mb-4 shadow-lg">
            <WalletCards size={48} className="text-primary" />
          </div>
          <h2 className="fw-900 text-white mb-2 tracking-tight">FinDash</h2>
          <p className="text-white-50 mb-5">{t('common.login_welcome')}</p>
          
          <form onSubmit={handleLogin} className="text-start">
            <div className="mb-4">
              <label className="fw-800 text-white-50 smaller text-uppercase tracking-widest mb-2 d-block">{t('common.your_name')}</label>
              <div className="position-relative">
                <User size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-white-50" />
                <input 
                  type="text" 
                  className="form-control form-control-lg login-input ps-5 py-3 rounded-4" 
                  placeholder="Ex: Rafael Tavares"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-lg w-100 py-3 rounded-4 fw-800 shadow-lg border-0 d-flex align-items-center justify-content-center gap-2 hover-lift"
              disabled={!tempName.trim() || loading}
            >
              {loading ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">{t('common.loading')}</span>
                </div>
              ) : (
                <>
                  <LogIn size={20} strokeWidth={2.5} />
                  {t('common.access_panel')}
                </>
              )}
            </button>
          </form>
          
          <p className="mt-5 text-white-50 smaller mb-0">
            {t('common.data_privacy_note')}
          </p>
        </div>
        
        <style jsx>{`
          .login-input {
            background: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            color: white !important;
          }
          .login-input::placeholder {
            color: rgba(255, 255, 255, 0.4) !important;
          }
          .glass-card {
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .fw-800 { font-weight: 800; }
          .fw-900 { font-weight: 900; }
          .tracking-widest { letter-spacing: 0.15em; }
          .tracking-tight { letter-spacing: -0.02em; }
          .smaller { font-size: 0.75rem; }
          .hover-lift:hover { transform: translateY(-3px); }
          .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
