import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/student-classes.css'
import './styles/student-dashboard.css'
import './styles/student-overview.css'
import './styles/student-result.css'
import './styles/student-speaking.css'
import './styles/student-ecosystem.css'
import './styles/teacher.css'
import './styles/teacher-assignment-edit.css'
import './styles/teacher-exam-bank.css'
import './styles/teacher-dashboard.css'
import './styles/teacher-class-details.css'
import './styles/login.css'
import './styles/admin.css'
import './styles/admin-modern.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
