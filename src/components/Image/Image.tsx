import { forwardRef, type ImgHTMLAttributes, useState } from 'react'
import { cn } from '../../lib/cn'

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: 'square' | 'video' | 'wide'
  objectFit?: 'cover' | 'contain'
  fallback?: React.ReactNode
}

const aspectClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[16/9]',
} as const

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      className,
      aspectRatio,
      objectFit = 'cover',
      loading = 'lazy',
      fallback,
      alt,
      onError,
      ...props
    },
    ref,
  ) => {
    const [hasError, setHasError] = useState(false)

    if (hasError && fallback) {
      return (
        <div
          className={cn(
            'flex w-full max-w-full items-center justify-center overflow-hidden rounded-lg bg-muted',
            aspectRatio && aspectClasses[aspectRatio],
            className,
          )}
        >
          {fallback}
        </div>
      )
    }

    return (
      <img
        ref={ref}
        alt={alt}
        loading={loading}
        className={cn(
          'h-auto w-full max-w-full',
          aspectRatio && aspectClasses[aspectRatio],
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          className,
        )}
        onError={(event) => {
          setHasError(true)
          onError?.(event)
        }}
        {...props}
      />
    )
  },
)

Image.displayName = 'Image'
