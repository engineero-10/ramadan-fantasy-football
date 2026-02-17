import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1 min - data considered fresh
      gcTime: 10 * 60 * 1000,    // 10 min - cache retention (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'Tajawal, Cairo, sans-serif',
              direction: 'rtl'
            }
          }}
        />
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
