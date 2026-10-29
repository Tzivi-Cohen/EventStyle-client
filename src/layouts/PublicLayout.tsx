import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ContactLinks } from '../components/ContactLinks'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

const brandClass = 'inline-flex items-center gap-2 font-serif text-[1.5rem] font-bold tracking-[0.01em] no-underline'

export function PublicLayout() {
  const { user, status, sessionError, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPath, setMenuPath] = useState(location.pathname)

  // מעבר עמוד סוגר את התפריט בנייד
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname)
    setMenuOpen(false)
  }

  function handleLogout() {
    logout()
    toast.success('התנתקת בהצלחה')
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="absolute start-4 -top-[100px] z-[100] rounded-field bg-navy px-4 py-[0.6rem] text-white focus:top-4 focus:text-white">
        דילוג לתוכן הראשי
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-[rgb(250_247_242_/_0.92)] [backdrop-filter:blur(10px)]">
        <div className="container flex min-h-[72px] items-center justify-between gap-4">
          <Link to="/" className={`${brandClass} text-navy`} aria-label="EventStyle – דף הבית">
            <span className="text-[1.1rem] text-gold" aria-hidden="true">
              ✦
            </span>
            EventStyle
          </Link>
          <button
            type="button"
            className="hidden h-[44px] w-[44px] cursor-pointer rounded-field border border-line-strong bg-transparent [font-family:inherit] [font-style:inherit] [font-weight:inherit] [line-height:inherit] text-[1.4rem] text-navy [@media(max-width:760px)]:inline-grid [@media(max-width:760px)]:place-items-center"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'סגירת התפריט' : 'פתיחת התפריט'}</span>
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          </button>
          <nav id="main-nav" className={`site-nav ${menuOpen ? 'open' : ''}`} aria-label="ניווט ראשי">
            <NavLink to="/" end>
              בית
            </NavLink>
            <NavLink to="/packages">חבילות ומחירים</NavLink>
            <NavLink to="/gallery">גלריה</NavLink>
            <NavLink to="/contact">הזמנת עיצוב</NavLink>
            {status === 'authenticated' && user?.role === 'Client' && <NavLink to="/my-events">האירועים שלי</NavLink>}
            {status === 'authenticated' && user?.role === 'Admin' && <NavLink to="/admin">ניהול</NavLink>}
            {status === 'authenticated' && user && (
              <>
                <NavLink to="/account" className="nav-account">
                  {user.fullName}
                </NavLink>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                  התנתקות
                </button>
              </>
            )}
            {status === 'anonymous' && (
              <>
                <NavLink to="/login">התחברות</NavLink>
                <NavLink to="/register" className="btn btn-sm">
                  הרשמה
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      {sessionError && (
        <div className="container">
          <p className="alert alert-warning session-error" role="alert">
            {sessionError}
          </p>
        </div>
      )}

      <div id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </div>

      <footer className="mt-16 border-t-[3px] border-t-gold bg-navy pt-12 pb-6 text-[#e9e4d8]">
        <div className="container grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8">
          <div>
            <p className={`${brandClass} text-white`}>
              <span className="text-[1.1rem] text-gold" aria-hidden="true">
                ✦
              </span>
              EventStyle
            </p>
            <p className="muted text-[#b9b5aa]">סטודיו לעיצוב אירועים</p>
          </div>
          <nav aria-label="קישורים בתחתית העמוד" className="flex flex-col gap-[0.4rem]">
            <Link to="/packages" className="text-[#f1dfb4]">
              חבילות ומחירים
            </Link>
            <Link to="/gallery" className="text-[#f1dfb4]">
              גלריה
            </Link>
            <Link to="/contact" className="text-[#f1dfb4]">
              הזמנת עיצוב
            </Link>
          </nav>
          <div className="flex flex-col gap-[0.4rem]">
            <p className="m-0 font-semibold text-white">להזמנות</p>
            <ContactLinks variant="inline" />
          </div>
        </div>
        <p className="container muted mt-8 text-[0.85rem] text-[#b9b5aa]">© EventStyle</p>
      </footer>
    </div>
  )
}
