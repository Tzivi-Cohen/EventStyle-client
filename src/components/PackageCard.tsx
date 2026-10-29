import type { Package } from '../types/package'
import { EVENT_TYPE_LABELS, formatPrice } from '../utils/format'
import { SafeImage } from './ui/SafeImage'

export function PackageCard({ pkg }: { pkg: Package }) {
  return (
    <article className="card">
      <SafeImage src={pkg.imageUrl} alt={pkg.name} className="card-image" />
      <div className="card-body">
        <p className="eyebrow">{pkg.eventType ? EVENT_TYPE_LABELS[pkg.eventType] : 'חבילה כללית'}</p>
        <h3>{pkg.name}</h3>
        <p className="mb-2 font-serif text-[1.6rem] text-gold-deep">{formatPrice(pkg.price)}</p>
        <p className="muted">{pkg.description}</p>
        <ul className="mx-0 mt-4 mb-0 grid list-none gap-[0.35rem] p-0">
          {pkg.features.map((feature) => (
            <li key={feature} className="before:me-2 before:text-[0.8em] before:text-gold before:content-['✦']">{feature}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}
