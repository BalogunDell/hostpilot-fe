import { cn } from '../../lib/cn'

const sizeClasses = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
} as const

export interface AvatarProps {
  src?: string
  alt: string
  fallback: string
  size?: keyof typeof sizeClasses
  className?: string
}

export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className,
}: AvatarProps) {
  const initials = fallback.slice(0, 2).toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          'shrink-0 rounded-full object-cover',
          sizeClasses[size],
          className,
        )}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={alt}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-secondary-100 font-medium text-secondary-600',
        sizeClasses[size],
        className,
      )}
    >
      {initials}
    </span>
  )
}
