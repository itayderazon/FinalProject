import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Global reset and project utilities
import './styles/base/reset.css'
import './index.css'
import './styles/product-catalog/productCatalog.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
