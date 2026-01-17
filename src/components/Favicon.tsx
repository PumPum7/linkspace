import { getFaviconUrl } from '@/lib/favicon'
import { useState } from 'react'

interface FaviconProps {
  url: string
  title: string
  size?: number
  className?: string
}

export function Favicon({
  url,
  title,
  size = 20,
  className = '',
}: FaviconProps) {
  const [hasError, setHasError] = useState(false)
  const faviconUrl = getFaviconUrl(url, 32)

  if (hasError || !faviconUrl) {
    // Fallback to first letter
    return (
      <div
        className={`flex items-center justify-center rounded bg-muted text-muted-foreground text-xs font-medium ${className}`}
        style={{ width: size, height: size }}
      >
        {title.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={faviconUrl}
      alt=""
      width={size}
      height={size}
      className={`rounded ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  )
}
