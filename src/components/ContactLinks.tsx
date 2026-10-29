import { env } from '../config/env'
import { formatPhone } from '../utils/format'

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11.5 11.5 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a1.8 1.8 0 0 1-1.9 1.8A16.5 16.5 0 0 1 3.2 5.4 1.8 1.8 0 0 1 5 3.5Z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.8 6.5 8.2 6.3 8.2-6.3" />
    </svg>
  )
}

const styles = {
  cards: {
    list: 'mx-0 mt-5 mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-4 p-0',
    link: 'flex h-full items-center gap-[0.9rem] rounded-card border border-line bg-[linear-gradient(135deg,var(--surface),var(--gold-tint))] px-5 py-[1.1rem] text-inherit no-underline shadow-card transition-[transform,box-shadow,border-color] duration-250 ease-studio hover:[transform:translateY(-2px)] hover:border-line-strong hover:text-inherit hover:shadow-raised',
    icon: 'grid size-12 flex-none place-items-center rounded-full bg-[linear-gradient(135deg,#8d6b25,var(--gold-deep))] text-white shadow-[0_4px_12px_rgb(122_92_30_/_0.25)]',
    value: 'text-end text-[1.15rem] font-semibold wrap-anywhere text-navy',
  },
  inline: {
    list: 'm-0 flex list-none flex-col gap-2 p-0',
    link: 'flex items-center gap-[0.55rem] text-[#f1dfb4] no-underline hover:text-white',
    icon: 'inline-grid text-gold',
    value: 'underline underline-offset-3',
  },
}


export function ContactLinks({ variant = 'cards' }: { variant?: 'cards' | 'inline' }) {
  const style = styles[variant]
  const phoneHref = `tel:${env.contactPhone.replace(/[^\d+]/g, '')}`
  const items = [
    { key: 'phone', label: 'טלפון', value: formatPhone(env.contactPhone), href: phoneHref, icon: <PhoneIcon />, action: 'חיוג לסטודיו' },
    { key: 'email', label: 'אימייל', value: env.contactEmail, href: `mailto:${env.contactEmail}`, icon: <MailIcon />, action: 'שליחת מייל לסטודיו' },
  ]

  return (
    <ul className={style.list}>
      {items.map((item) => (
        <li key={item.key}>
          <a href={item.href} className={style.link} aria-label={`${item.action}: ${item.value}`}>
            <span className={style.icon}>{item.icon}</span>
            <span className="flex min-w-0 flex-col">
              {variant === 'cards' && <span className="text-[0.8rem] font-semibold tracking-[0.08em] text-gold-deep">{item.label}</span>}
              <span className={style.value} dir="ltr">
                {item.value}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
