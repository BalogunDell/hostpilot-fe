import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { fetchPropertyReportPdf, downloadPropertyReportPdf } from '../api/client'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Skeleton } from './Skeleton'
import { Typography } from './Typography'

interface PropertyReportViewerProps {
  open: boolean
  onClose: () => void
  propertyId: string
  propertyName: string
  token: string | null
}

export function PropertyReportViewer({
  open,
  onClose,
  propertyId,
  propertyName,
  token,
}: PropertyReportViewerProps) {
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setReportUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadReport() {
      setLoading(true)
      setError(null)
      try {
        const { blob } = await fetchPropertyReportPdf(propertyId, token)
        if (cancelled) return
        setReportUrl((current) => {
          if (current) URL.revokeObjectURL(current)
          return URL.createObjectURL(blob)
        })
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load report')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReport()

    return () => {
      cancelled = true
    }
  }, [open, propertyId, token])

  useEffect(() => {
    return () => {
      if (reportUrl) URL.revokeObjectURL(reportUrl)
    }
  }, [reportUrl])

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadPropertyReportPdf(propertyId, token)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${propertyName} — Performance Report`}
      description="Monthly performance summary for this property."
      className="max-w-4xl"
    >
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex h-[70vh] flex-col gap-4 rounded-lg border border-border bg-muted/30 p-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
            <Skeleton className="flex-1 rounded-lg" />
          </div>
        ) : null}

        {error ? (
          <Typography variant="caption" className="text-destructive">
            {error}
          </Typography>
        ) : null}

        {!loading && reportUrl ? (
          <iframe
            title={`${propertyName} performance report`}
            src={reportUrl}
            className="h-[70vh] w-full rounded-lg border border-border bg-white"
          />
        ) : null}

        <div className="flex justify-end">
          <Button
            variant="outlined"
            onClick={handleDownload}
            disabled={loading || downloading || Boolean(error)}
          >
            <Download className="size-4" aria-hidden />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
