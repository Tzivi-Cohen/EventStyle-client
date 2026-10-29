import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types/user'

/**
 * נתיב למשתמשת מחוברת בלבד, ואופציונלית רק לתפקידים מסוימים.
 * זו חוויית משתמש בלבד – ההרשאות האמיתיות נבדקות בשרת בכל בקשה (401 / 403).
 */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { status, user, signedOut } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingSpinner label="בודק התחברות..." />
  if (status === 'anonymous' || !user) {
    // אחרי התנתקות יזומה – לדף הבית; אחרת (גישה ישירה או Token שפג) – להתחברות, עם חזרה לדף המבוקש
    if (signedOut) return <Navigate to="/" replace />
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
