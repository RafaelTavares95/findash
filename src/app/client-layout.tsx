'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { DataPersistence } from "@/components/DataPersistence";
import { AuthGuard } from "@/components/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";
import { LogOut, LayoutDashboard, WalletCards } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.user.currentUser);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleLogout = () => {
    dispatch(setUser(null));
  };

  return (
    <AuthGuard>
      <div className="container-fluid p-0">
        <DataPersistence />
        <div className="row g-0 vh-100 overflow-hidden">
          {/* Sidebar for desktop */}
          <aside className="col-auto col-md-3 col-xl-2 d-none d-md-flex flex-column sidebar p-3 text-white">
            <div className="d-flex align-items-center gap-2 mb-5 px-3 mt-2">
              <div className="bg-primary rounded-3 p-2 d-flex align-items-center justify-content-center shadow-lg">
                <WalletCards size={24} className="text-white" />
              </div>
              <span className="fs-4 fw-bold tracking-tight text-white">FinDash</span>
            </div>
            
            <nav className="nav flex-column flex-grow-1">
              <Link 
                href="/" 
                className={`nav-link d-flex align-items-center gap-3 mb-2 px-3 ${pathname === '/' ? 'active' : ''}`}
              >
                <LayoutDashboard size={20} />
                <span>{t('common.dashboard')}</span>
              </Link>
              <Link 
                href="/control" 
                className={`nav-link d-flex align-items-center gap-3 mb-2 px-3 ${pathname === '/control' ? 'active' : ''}`}
              >
                <WalletCards size={20} />
                <span>{t('common.control')}</span>
              </Link>
            </nav>

            <div className="mt-auto px-3 py-4 border-top border-secondary border-opacity-10">
              <button 
                onClick={handleLogout}
                className="btn btn-link text-white-50 p-0 text-decoration-none d-flex align-items-center gap-2 hover-text-danger transition-all w-100"
              >
                <LogOut size={18} />
                <span className="small fw-bold">{t('common.logout')}</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="col d-flex flex-column h-100 overflow-auto main-content">
            {/* Mobile Header */}
            <header className="d-md-none p-3 bg-dark text-white d-flex flex-column gap-3 sticky-top shadow-sm">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-primary rounded-2 p-1 d-flex align-items-center justify-content-center shadow-sm">
                    <WalletCards size={18} className="text-white" />
                  </div>
                  <span className="fw-bold fs-5">FinDash</span>
                </div>
                
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex flex-column align-items-end me-1">
                    <span className="fw-bold small">{user?.name}</span>
                    <span className="text-white-50" style={{ fontSize: '0.65rem' }}>{t('common.active_user')}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="btn btn-link text-danger p-0 text-decoration-none d-flex align-items-center justify-content-center"
                    aria-label="Sair"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
              
              <div className="d-flex gap-2">
                <Link 
                  href="/" 
                  className={`btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-2 ${pathname === '/' ? 'btn-primary shadow-sm' : 'btn-outline-light border-0 bg-white bg-opacity-10'}`}
                >
                  <LayoutDashboard size={16} />
                  <span className="fw-medium">{t('common.dashboard')}</span>
                </Link>
                <Link 
                  href="/control" 
                  className={`btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-2 ${pathname === '/control' ? 'btn-primary shadow-sm' : 'btn-outline-light border-0 bg-white bg-opacity-10'}`}
                >
                  <WalletCards size={16} />
                  <span className="fw-medium">{t('common.control')}</span>
                </Link>
              </div>
            </header>

            {/* Desktop Top Bar */}
            <nav className="navbar navbar-expand navbar-light bg-white border-bottom px-4 py-3 d-none d-md-flex sticky-top rounded-0">
              <div className="container-fluid px-0">
                <div className="d-flex flex-column">
                  <span className="text-muted small fw-medium text-uppercase tracking-wider">{t('common.welcome_to')}</span>
                  <h4 className="fw-bold mb-0">{t('common.your_financial_dashboard')}</h4>
                </div>
                <div className="ms-auto d-flex align-items-center gap-4">
                  <LanguageSwitcher />
                  <div className="d-flex flex-column align-items-end me-2">
                    <span className="fw-bold small">{user?.name}</span>
                    <span className="text-muted smaller" style={{ fontSize: '0.75rem' }}>{t('common.active_user')}</span>
                  </div>
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: 40, height: 40 }}>
                    <span className="fw-900 small">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </nav>

            <div className="p-3 p-md-5 animate-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
