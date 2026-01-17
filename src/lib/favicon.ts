// Favicon utilities using Google's favicon service

/**
 * Get favicon URL for a given website URL
 * Uses Google's favicon service which is reliable and fast
 */
export function getFaviconUrl(url: string, size: 16 | 32 | 64 = 32): string {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname
    // Google's favicon service
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
  } catch {
    return ''
  }
}

/**
 * Extract domain from URL for display
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Favicon component props
 */
export interface FaviconProps {
  url: string
  size?: 16 | 32 | 64
  fallback?: string
  className?: string
}
