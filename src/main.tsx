import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { prefetchForRoute } from './api/prefetch';
import { applyBrandingToDocument } from '@config/branding';
import './index.css';

// The title and favicon come from the same env values index.html was stamped
// with, so a cached document cannot show a stale brand.
applyBrandingToDocument();

// Start the dashboard's requests before the first render, so they overlap the
// session check instead of queueing behind it.
prefetchForRoute(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
