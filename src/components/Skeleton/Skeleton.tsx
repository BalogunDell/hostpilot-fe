import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const skeletonVariants = cva('animate-pulse bg-muted', {
  variants: {
    variant: {
      default: 'rounded-md',
      text: 'h-4 rounded',
      circle: 'rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      aria-hidden
      {...props}
    />
  )
}
