import { Link } from 'react-router-dom'
import { ContactLinks } from '../components/ContactLinks'
import { PageHeader } from '../components/ui/PageHeader'

export function ContactPage() {
  return (
    <main className="page container narrow">
      <PageHeader eyebrow="הזמנת עיצוב" title="איך מזמינים" />
      <div className="card card-padded prose">
        <h2 className="section-title">בקשה מקוונת</h2>
        <ol>
          <li>
            בוחרים סוג אירוע וחבילה ב<Link to="/packages">מחירון</Link>.
          </li>
          <li>
            <Link to="/register">נרשמים</Link> לאתר עם אימייל וסיסמה, או מתחברים עם Google.
          </li>
          <li>
            שולחים <Link to="/my-events/new">בקשה לעיצוב</Link>: תאריך, מיקום, מספר אורחים, צבעים וקונספט. עד שהסטודיו
            מאשר – אפשר לערוך אותה.
          </li>
          <li>אחרי האישור האירוע מופיע באזור האישי, ושם עוקבים אחרי ההכנות.</li>
        </ol>
        <p className="muted">אין באתר תשלום מקוון – המחירון להצגה, והפרטים הסופיים נסגרים מול הסטודיו.</p>

        <h2 className="section-title">פנייה ישירה</h2>
        <p>
          מעדיפים לדבר איתנו? אפשר לפנות לסטודיו בטלפון או במייל. הסטודיו יפתח את האירוע עם כתובת האימייל שלכם, והוא
          יופיע באזור האישי כשתתחברו עם Google באותה כתובת (Gmail).
        </p>

        <ContactLinks />
      </div>
    </main>
  )
}
