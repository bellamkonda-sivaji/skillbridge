import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { SimpleModeProvider } from './a11y/SimpleMode'
import './a11y/a11y.css'
import './i18n'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SimpleModeProvider>
        <App />
        </SimpleModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
