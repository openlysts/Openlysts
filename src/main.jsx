import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Hairline minimal — always light mode
document.documentElement.classList.remove('dark');
localStorage.removeItem('theme');

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)