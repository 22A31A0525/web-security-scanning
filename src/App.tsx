import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './auth/Login'
import Layout from './layouts/Layout'
import Dashboard from './dashboard/Dashboard'
import TargetsPage from './targets/TargetsPage'
import ScansPage from './scans/ScansPage'
import FindingsPage from './findings/FindingsPage'
import ApiSettingsView from './settings/ApiSettingsView'
import NotFound from './notFound/NotFound'
import { useAuthStore } from './store/useAuthStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protected App Routes using Layout and Dedicated Route Views */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/targets" element={<TargetsPage />} />
          <Route path="/scans" element={<ScansPage />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="/settings" element={<ApiSettingsView />} />
        </Route>

        {/* 404 Fallback for Unspecified Routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
