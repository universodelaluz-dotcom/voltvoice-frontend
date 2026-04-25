import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './i18n'
import { YouTubeStudioApp } from './youtube/YouTubeStudioApp'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <YouTubeStudioApp />
  </React.StrictMode>,
)
