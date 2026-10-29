import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { useAdminEvents } from '../../hooks/useEvents'
import { useAdminPhotos } from '../../hooks/usePhotos'

const PENDING = { publishConsent: true, inGallery: false, page: 1, limit: 1 }
const PENDING_REQUESTS = { status: 'Pending' as const, page: 1, limit: 1 }

export function AdminHomePage() {
  const { user } = useAuth()
  const pending = useAdminPhotos(PENDING)
  const pendingCount = pending.data?.pagination.totalItems
  const requestsCount = useAdminEvents(PENDING_REQUESTS).data?.pagination.totalItems

  const areas = [
    {
      to: '/admin/events',
      title: 'אירועים ובקשות',
      text: requestsCount
        ? `${requestsCount} בקשות של לקוחות ממתינות לאישור. יצירה, עריכה, סטטוס ההכנות ותמונות.`
        : 'בקשות של לקוחות, יצירה, עריכה, סטטוס ההכנות ותמונות לכל אירוע.',
    },
    {
      to: '/admin/photos',
      title: 'תמונות לפרסום',
      text: pendingCount ? `${pendingCount} תמונות קיבלו הסכמה וממתינות לפרסום.` : 'תמונות של לקוחות שקיבלו הסכמה לפרסום.',
    },
    { to: '/admin/gallery', title: 'גלריה', text: 'העלאה, פרסום והסתרה, תמונות מובילות וסדר.' },
    { to: '/admin/packages', title: 'חבילות ומחירון', text: 'חבילות לפי סוג אירוע, מחירים, סדר וארכיון.' },
  ]

  return (
    <>
      <PageHeader eyebrow="ממשק ניהול" title={`שלום, ${user?.fullName ?? ''}`} description="בחרי אזור לניהול." />
      <ul className="card-grid">
        {areas.map((area) => (
          <li key={area.to}>
            <Link to={area.to} className="card card-padded admin-area">
              <h2>{area.title}</h2>
              <p className="muted">{area.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
