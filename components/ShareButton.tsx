'use client'

import type { MouseEvent } from 'react'
import { useEffect, useState } from 'react'

type ShareButtonProps = {
  href: string
  title: string
  text?: string
  label?: string
  copiedLabel?: string
  className?: string
  stopPropagation?: boolean
  onSuccess?: () => void
}

function toAbsoluteUrl(href: string) {
  if (/^https?:\/\//i.test(href)) {
    return href
  }

  if (typeof window === 'undefined') {
    return href
  }

  return new URL(href, window.location.origin).toString()
}

export default function ShareButton({
  href,
  title,
  text,
  label = 'Podeli link',
  copiedLabel = 'Link kopiran',
  className = '',
  stopPropagation = false,
  onSuccess,
}: ShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setIsCopied(false)
    }, 1800)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isCopied])

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation()
    }

    const shareUrl = toAbsoluteUrl(href)

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        })
        onSuccess?.()
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        setIsCopied(true)
        onSuccess?.()
        return
      }

      window.open(shareUrl, '_blank', 'noopener,noreferrer')
      onSuccess?.()
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return
      }

      console.error('Share failed:', error)
    }
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {isCopied ? copiedLabel : label}
    </button>
  )
}
