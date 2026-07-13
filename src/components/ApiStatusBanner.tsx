import { useEffect, useState } from 'react'
import { checkApiHealth } from '../api/client'

export function ApiStatusBanner() {
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) return

    checkApiHealth().then(setOnline)
    const interval = window.setInterval(() => {
      checkApiHealth().then(setOnline)
    }, 15_000)
    return () => window.clearInterval(interval)
  }, [])

  if (!import.meta.env.DEV || online !== false) return null

  return (
    <div className="bg-destructive px-4 py-2 text-center text-sm text-white">
      API offline — run <code className="rounded bg-black/20 px-1">npm run dev:all</code> (or{' '}
      <code className="rounded bg-black/20 px-1">npm run dev:api</code> on port 3000).
    </div>
  )
}
