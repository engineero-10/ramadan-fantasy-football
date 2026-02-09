import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
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
  </React.StrictMode>
);
