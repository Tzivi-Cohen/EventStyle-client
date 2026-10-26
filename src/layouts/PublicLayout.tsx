import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function PublicLayout() {
  const { user, status, sessionError, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="brand">
            EventStyle
          </Link>
          <nav className="site-nav" aria-label="ניווט ראשי">
            <NavLink to="/" end>
              חבילות
            </NavLink>
            {status === 'authenticated' && user && (
              <>
                <NavLink to="/account">{user.fullName}</NavLink>
                <button type="button" className="btn btn-outline" onClick={handleLogout}>
                  התנתקות
                </button>
              </>
            )}
            {status === 'anonymous' && (
              <NavLink to="/login" className="btn">
                התחברות
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      {sessionError && (
        <p className="status error session-error" role="alert">
          {sessionError}
        </p>
      )}
      <Outlet />
    </>
  )
}
