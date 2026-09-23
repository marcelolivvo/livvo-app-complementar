import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';

// Guard against third-party cross-origin "Script error." (e.g. from browser extensions or iframe envelopes)
window.addEventListener('error', (event) => {
  if (event.message === 'Script error.' || !event.message) {
    console.warn('Caught cross-origin/external script error:', event);
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.warn('Caught unhandled promise rejection safely:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
