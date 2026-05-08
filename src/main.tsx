import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ── Silence React Router's spurious "No routes matched location 'srcdoc'" ────
// React's scheduler (chunk-M324AGAM.js) uses postMessage("srcdoc") internally
// to schedule work between frames. React Router's warning() sees a render
// triggered by that postMessage tick and calls console.warn() with the message
// "No routes matched location \"srcdoc\"" — but window.location is always
// correct. This is pure noise; the filter below drops only that exact message.
const _warn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  // React Router passes the full message as a single string in args[0]
  if (typeof args[0] === 'string' && args[0].includes('srcdoc')) {
    return;
  }
  _warn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);