import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { StoreProvider } from './store/Store'
import Site from './pages/Site'
import Toast from './components/ui/Toast'

// O painel só é baixado quando alguém acessa /admin
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Site />} />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div className="min-h-screen bg-nude-50" />}>
                <AdminApp />
              </Suspense>
            }
          />
        </Routes>
        <Toast />
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>
)
