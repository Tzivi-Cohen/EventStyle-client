import { Link, useSearchParams } from 'react-router-dom'
import { PackageCard } from '../components/PackageCard'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryState } from '../components/ui/QueryState'
import { usePackages } from '../hooks/usePublicData'
import { EVENT_TYPES, type EventType } from '../types/common'
import type { Package } from '../types/package'
import { tabClass, tabListClass } from '../styles/tabClasses'
import { EVENT_TYPE_LABELS } from '../utils/format'

const isEventType = (value: string | null): value is EventType => (EVENT_TYPES as readonly string[]).includes(value ?? '')


export function PackagesPage() {
  const [params, setParams] = useSearchParams()
  const typeParam = params.get('type')
  const selected = isEventType(typeParam) ? typeParam : undefined
  const query = usePackages(selected)

  return (
    <main className="page container">
      <PageHeader
        eyebrow="מחירון"
        title="חבילות ומחירים"
        description="בחרו סוג אירוע כדי לראות את החבילות שמתאימות לו. המחירים להצגה בלבד – ההזמנה נעשית בפנייה לסטודיו."
      />

      <div className={tabListClass} role="tablist" aria-label="סוג אירוע">
        <button type="button" role="tab" aria-selected={!selected} className={tabClass(!selected)} onClick={() => setParams({})}>
          כל החבילות
        </button>
        {EVENT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={selected === type}
            className={tabClass(selected === type)}
            onClick={() => setParams({ type })}
          >
            {EVENT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <QueryState
        query={query}
        loadingLabel="טוען את המחירון..."
        isEmpty={(list) => list.length === 0}
        empty={
          <EmptyState
            title="עדיין אין חבילות להצגה"
            description="המחירון מתעדכן בקרוב. אפשר לפנות לסטודיו לקבלת הצעה."
            action={<Link to="/contact" className="btn">יצירת קשר</Link>}
          />
        }
      >
        {(list) => <PackageGroups packages={list} selected={selected} />}
      </QueryState>

      <section className="cta-band">
        <h2>מצאתם חבילה שמתאימה לכם?</h2>
        <p>ההזמנה נעשית בפנייה ישירה לסטודיו. נשמח לתכנן איתכם את העיצוב.</p>
        <Link to="/contact" className="btn">
          איך מזמינים
        </Link>
      </section>
    </main>
  )
}

function PackageGroups({ packages, selected }: { packages: Package[]; selected?: EventType }) {
  const general = packages.filter((p) => p.eventType === null)
  const groups: { title: string; items: Package[] }[] = selected
    ? [{ title: `חבילות ל${EVENT_TYPE_LABELS[selected]}`, items: packages.filter((p) => p.eventType === selected) }]
    : EVENT_TYPES.map((type) => ({ title: EVENT_TYPE_LABELS[type], items: packages.filter((p) => p.eventType === type) }))
  groups.push({ title: selected ? 'חבילות כלליות שמתאימות גם לאירוע הזה' : 'חבילות כלליות', items: general })

  return (
    <>
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.title} className="section">
            <h2 className="section-title">{group.title}</h2>
            <div className="card-grid">
              {group.items.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </section>
        ))}
    </>
  )
}
