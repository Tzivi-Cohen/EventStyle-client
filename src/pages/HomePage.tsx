import { Link } from 'react-router-dom'
import { GalleryGrid } from '../components/GalleryGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { QueryState } from '../components/ui/QueryState'
import { useGallery } from '../hooks/usePublicData'
import { eventTypeBackground } from '../styles/eventTypeBackgrounds'
import { EVENT_TYPES } from '../types/common'
import { EVENT_TYPE_DESCRIPTIONS, EVENT_TYPE_LABELS } from '../utils/format'

const FEATURED = { featured: true, limit: 6 }

export function HomePage() {
  const featured = useGallery(FEATURED)

  return (
    <main>
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">סטודיו לעיצוב אירועים</p>
          <h1>
            עיצוב שמספר את
            <br />
            <em>הסיפור שלכם</em>
          </h1>
          <p className="hero-lead">
            ימי הולדת, בת מצווה, בריתות, אירועי חברה ואירועים פרטיים – מתכננים יחד, ואתם עוקבים אחרי ההכנות באזור האישי.
          </p>
          <div className="hero-actions">
            <Link to="/my-events/new" className="btn btn-lg">
              שליחת בקשה לעיצוב
            </Link>
            <Link to="/packages" className="btn btn-outline btn-lg">
              לחבילות ולמחירים
            </Link>
          </div>
          <ul className="mx-0 mt-8 mb-0 flex list-none flex-wrap justify-center gap-x-7 gap-y-2 p-0 text-[0.92rem] text-ink-soft [@media(max-width:480px)]:flex-col [@media(max-width:480px)]:items-center">
            {['עיצוב אישי לכל אירוע', 'מחירון שקוף לפי סוג אירוע', 'מעקב אחרי הבקשה באזור האישי'].map((text) => (
              <li key={text} className="before:me-[0.4rem] before:font-bold before:text-gold-deep before:content-['✓']">
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">סוגי האירועים שלנו</h2>
        <ul className="type-grid">
          {EVENT_TYPES.map((type) => (
            <li key={type} className={`card type-card ${eventTypeBackground[type]}`}>
              <span
                className="mb-3 inline-grid size-10 place-items-center rounded-full bg-[rgb(255_255_255_/_0.75)] text-gold shadow-[0_2px_8px_rgb(28_35_51_/_0.08)]"
                aria-hidden="true"
              >
                ✦
              </span>
              <h3>{EVENT_TYPE_LABELS[type]}</h3>
              <p className="muted">{EVENT_TYPE_DESCRIPTIONS[type]}</p>
              <div className="type-links">
                <Link to={`/packages?type=${type}`}>מחירון</Link>
                <Link to={`/gallery/${type}`}>גלריה</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2 className="section-title">עבודות נבחרות</h2>
          <Link to="/gallery">לכל הגלריות ←</Link>
        </div>
        <QueryState
          query={featured}
          loadingLabel="טוען עבודות נבחרות..."
          isEmpty={(result) => result.data.length === 0}
          empty={<EmptyState title="עבודות נבחרות יוצגו כאן בקרוב" description="בינתיים אפשר לעיין בגלריה לפי סוג אירוע." />}
        >
          {(result) => <GalleryGrid items={result.data} />}
        </QueryState>
      </section>

      <section className="section container">
        <h2 className="section-title">איך זה עובד</h2>
        <ol className="steps">
          <li>
            <h3>שולחים בקשה</h3>
            <p className="muted">נרשמים, בוחרים חבילה מהמחירון ומספרים לנו על האירוע: תאריך, מיקום, צבעים וקונספט.</p>
          </li>
          <li>
            <h3>הסטודיו מאשר</h3>
            <p className="muted">אנחנו בודקים את הבקשה ומאשרים אותה. עד האישור אפשר לערוך אותה בכל זמן.</p>
          </li>
          <li>
            <h3>עוקבים מהאזור האישי</h3>
            <p className="muted">רואים את סטטוס ההכנות, מעלים תמונות מהאירוע ומקבלים עדכונים במקום אחד.</p>
          </li>
        </ol>
      </section>

      <section className="cta-band container">
        <h2>מתכננים אירוע?</h2>
        <p>נשמח לשמוע עליו ולהציע עיצוב שמתאים בדיוק לכם.</p>
        <div className="hero-actions">
          <Link to="/my-events/new" className="btn btn-lg">
            שליחת בקשה לעיצוב
          </Link>
          <Link to="/contact" className="btn btn-outline btn-lg">
            איך מזמינים
          </Link>
        </div>
      </section>
    </main>
  )
}
