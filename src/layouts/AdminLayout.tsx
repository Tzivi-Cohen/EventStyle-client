import { NavLink, Outlet } from 'react-router-dom'

const linkBase = 'rounded-field px-[0.85rem] py-[0.6rem] no-underline'
const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${linkBase} active bg-navy font-semibold text-white` : `${linkBase} text-ink hover:bg-ivory`

/** תת-ניווט של ממשק הניהול (הנתיבים עצמם מוגנים ב-ProtectedRoute roles=['Admin']) */
export function AdminLayout() {
  return (
    <div className="container grid grid-cols-[220px_1fr] gap-8 pt-10 pb-4 [@media(max-width:900px)]:grid-cols-[1fr] [@media(max-width:900px)]:gap-5">
      <nav
        className="sticky top-24 flex flex-col gap-1 [align-self:start] rounded-card border border-line bg-surface p-3 [@media(max-width:900px)]:static [@media(max-width:900px)]:flex-row [@media(max-width:900px)]:overflow-x-auto [@media(max-width:900px)]:whitespace-nowrap"
        aria-label="ניווט ממשק הניהול"
      >
        <NavLink to="/admin" end className={linkClass}>
          סקירה
        </NavLink>
        <NavLink to="/admin/events" className={linkClass}>
          אירועים
        </NavLink>
        <NavLink to="/admin/photos" className={linkClass}>
          תמונות לפרסום
        </NavLink>
        <NavLink to="/admin/gallery" className={linkClass}>
          גלריה
        </NavLink>
        <NavLink to="/admin/packages" className={linkClass}>
          חבילות ומחירון
        </NavLink>
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
