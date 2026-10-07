import React from 'react';
import ReactDOM from 'react-dom/client';
import { LivvoApp } from './livvo/LivvoApp';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LivvoApp />
    </ErrorBoundary>
  </React.StrictMode>
);
