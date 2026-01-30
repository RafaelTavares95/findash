'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import '@/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Import bootstrap JS only on client side
    require('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <Provider store={store}>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {children}
    </Provider>
  );
}
