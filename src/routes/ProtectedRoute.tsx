import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'

/** נתיב למשתמש מחובר בלבד. נוחות בלבד – ההרשאות האמיתיות נבדקות בשרת */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingSpinner label="בודק התחברות..." />
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
