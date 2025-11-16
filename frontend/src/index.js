import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Enable smooth scrolling after initial page load to prevent auto-scroll to hash
if (window.location.hash === '') {
  // No hash on initial load, enable smooth scroll after a brief delay
  setTimeout(() => {
    document.documentElement.classList.add('smooth-scroll');
  }, 500);
} else {
  // Hash exists (user navigated to specific section), just enable smooth scroll
  document.documentElement.classList.add('smooth-scroll');
}