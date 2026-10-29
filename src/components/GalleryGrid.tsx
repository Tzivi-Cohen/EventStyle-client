import { useState } from 'react'
import type { GalleryItem } from '../types/gallery'
import { EVENT_TYPE_LABELS } from '../utils/format'
import { Lightbox } from './ui/Lightbox'
import { SafeImage } from './ui/SafeImage'

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 p-0">
        {items.map((item, index) => (
          <li key={item.id}>
            <button type="button" className="group relative block w-full cursor-zoom-in overflow-hidden rounded-card border-none bg-ivory-deep p-0 shadow-card" onClick={() => setOpenIndex(index)} aria-label={`הגדלת התמונה: ${item.title}`}>
              <SafeImage
                src={item.url}
                alt={item.title}
                className="aspect-[4/5] w-full object-cover transition-transform duration-500 ease-studio group-hover:[&:is(img)]:[transform:scale(1.04)]"
              />
              <span className="absolute inset-x-0 bottom-0 flex flex-col bg-[linear-gradient(transparent,rgb(20_24_36_/_0.78))] px-4 pt-10 pb-[0.85rem] text-start font-serif text-[1.05rem] text-white">
                <span>{item.title}</span>
                <small className="font-sans text-[0.8rem] opacity-90">{EVENT_TYPE_LABELS[item.category]}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {openIndex !== null && (
        <Lightbox
          items={items.map((item) => ({ url: item.url, title: item.title, subtitle: EVENT_TYPE_LABELS[item.category] }))}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  )
}
