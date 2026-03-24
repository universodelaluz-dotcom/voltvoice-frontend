import React from 'react'
import ReactDOM from 'react-dom/client'

// Simple fallback app
const App = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>VoltVoice</h1>
      <p>Lee chats en vivo de TikTok y YouTube</p>
      <p style={{ color: '#999' }}>Cargando aplicación...</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
