import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'

export function NotFoundPage() {
  return (
    <main className="page container narrow">
      <EmptyState
        title="הדף לא נמצא"
        description="ייתכן שהקישור שגוי, או שהדף הוסר."
        action={
          <Link to="/" className="btn">
            חזרה לדף הבית
          </Link>
        }
      />
    </main>
  )
}

export function ForbiddenPage() {
  return (
    <main className="page container narrow">
      <EmptyState
        title="אין לך הרשאה לדף הזה"
        description="הדף מיועד לסוג חשבון אחר."
        action={
          <Link to="/" className="btn">
            חזרה לדף הבית
          </Link>
        }
      />
    </main>
  )
}
