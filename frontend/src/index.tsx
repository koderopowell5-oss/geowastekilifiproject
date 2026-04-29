import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// Global error handler
let errorCount = 0;
const handleError = (error: Error | PromiseRejectionEvent) => {
  errorCount++;
  console.error('App Error:', error);
  
  // If too many errors, show error screen instead of hiding them
  if (errorCount > 10) {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #f3f4f6;
          padding: 20px;
        ">
          <div style="
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          ">
            <h1 style="color: #dc2626; margin: 0 0 10px 0; font-size: 24px;">⚠️ App Error</h1>
            <p style="color: #666; margin: 10px 0;">The app encountered an error and needs to reload.</p>
            <button onclick="location.reload()" style="
              background: #16a34a;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            ">Reload App</button>
          </div>
        </div>
      `;
    }
  }
};

// Suppress non-fatal ResizeObserver errors (common on mobile with keyboard)
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    args[0]?.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
    args[0]?.message?.includes('ResizeObserver loop limit exceeded') ||
    args[0]?.message?.includes('Unexpected End of JSON input')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Global error handlers
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
    event.message?.includes('ResizeObserver loop limit exceeded') ||
    event.message?.includes('Unexpected End of JSON input')
  ) {
    event.preventDefault();
    return;
  }
  handleError(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  handleError(event);
});

// Initialize Capacitor and Status Bar
const initializeApp = async () => {
  try {
    // Initialize StatusBar for native apps
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      } catch (e) {
        console.warn('StatusBar initialization failed:', e);
      }
    }
    
    console.log('✓ App initialized on platform:', Capacitor.getPlatform());
    console.log('✓ Is native:', Capacitor.isNativePlatform());
  } catch (error) {
    console.warn('Capacitor initialization warning:', error);
    // Continue even if Capacitor fails
  }
};

// Initialize before rendering
initializeApp().catch(console.warn);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
