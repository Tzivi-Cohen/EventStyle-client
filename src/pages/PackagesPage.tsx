import { useEffect, useState } from 'react'
import { packagesApi, systemApi } from '../api/packagesApi'
import type { Package } from '../types/api'
import { getErrorMessage } from '../utils/errorMessages'

const API_URL = import.meta.env.VITE_API_URL

export function PackagesPage() {
  const [health, setHealth] = useState<'loading' | 'ok' | 'error'>('loading')
  const [packages, setPackages] = useState<Package[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    systemApi
      .health()
      .then((res) => !cancelled && setHealth(res.status === 'ok' ? 'ok' : 'error'))
      .catch(() => !cancelled && setHealth('error'))

    packagesApi
      .list()
      .then((list) => !cancelled && setPackages(list))
      .catch((err: unknown) => !cancelled && setError(getErrorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="page">
      <h1>EventStyle</h1>

      {health === 'loading' && <p>בודק חיבור לשרת...</p>}
      {health === 'ok' && <p className="status ok">השרת מחובר ✔</p>}
      {health === 'error' && (
        <p className="status error">אין חיבור לשרת ({API_URL})</p>
      )}

      <h2>חבילות</h2>
      {error && <p className="status error">{error}</p>}
      {!error && packages.length === 0 && <p>אין חבילות להצגה</p>}

      <div className="packages">
        {packages.map((pkg) => (
          <div className="package-card" key={pkg.id}>
            <h3>{pkg.name}</h3>
            <p>₪{pkg.price}</p>
            <p>{pkg.description}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
