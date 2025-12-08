
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import api from './api';

// Auto-ping backend every 10 minutes to keep server awake
import emailApi from './emailServiceApi';

// Auto-ping backend and email service every 10 minutes to keep servers awake
setInterval(() => {
  api.get('/api/ping').catch(() => {});
  emailApi.get('/api/ping').catch(() => {});
}, 10 * 60 * 1000); // 10 minutes

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
