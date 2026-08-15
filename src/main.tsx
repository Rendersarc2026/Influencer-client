import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { prefetchForRoute } from './api/prefetch';
import './index.css';

// Start the dashboard's requests before the first render, so they overlap the
// session check instead of queueing behind it.
prefetchForRoute(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
