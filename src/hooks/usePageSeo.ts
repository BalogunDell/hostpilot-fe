import { useEffect } from 'react'

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

/** Updates document title + primary meta tags for SPA routes. */
export function usePageSeo({
  title,
  description,
  path = '/',
  noIndex = false,
}: {
  title: string
  description: string
  path?: string
  noIndex?: boolean
}) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title
    setMeta('description', description)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)

    const canonicalUrl = `https://hostsledger.com${path.startsWith('/') ? path : `/${path}`}`
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl
    setMeta('og:url', canonicalUrl, 'property')
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1')

    return () => {
      document.title = previousTitle
    }
  }, [title, description, path, noIndex])
}
