import { useState } from 'react'

export function SafeImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`image-placeholder ${className}`} role="img" aria-label={`${alt} – התמונה אינה זמינה`}>
        <span aria-hidden="true">✦</span>
        <span className="image-placeholder-text">התמונה אינה זמינה</span>
      </div>
    )
  }
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setFailed(true)} />
}
