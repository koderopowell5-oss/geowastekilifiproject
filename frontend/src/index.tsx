import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Suppress non-fatal ResizeObserver errors (common on mobile with keyboard)
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    args[0]?.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
    args[0]?.message?.includes('ResizeObserver loop limit exceeded')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Handle ResizeObserver errors globally
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
    event.message?.includes('ResizeObserver loop limit exceeded')
  ) {
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
