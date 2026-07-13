import { createElement, type HTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'font-heading text-4xl font-semibold tracking-tight text-foreground',
      h2: 'font-heading text-2xl font-semibold tracking-tight text-foreground',
      h3: 'font-heading text-xl font-semibold text-foreground',
      h4: 'font-heading text-lg font-semibold text-foreground',
      body: 'font-body text-body text-foreground',
      caption: 'font-body text-sm text-muted-foreground',
      label: 'font-label text-sm font-medium text-foreground',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
})

const defaultElements = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'p',
  caption: 'span',
  label: 'span',
} as const

export type TextVariant = NonNullable<
  VariantProps<typeof typographyVariants>['variant']
>

export interface TypographyProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: keyof HTMLElementTagNameMap
  children: ReactNode
}

export function Typography({
  variant = 'body',
  as,
  className,
  children,
  ...props
}: TypographyProps) {
  const resolvedVariant = variant ?? 'body'
  const element = as ?? defaultElements[resolvedVariant]

  return createElement(
    element,
    {
      className: cn(typographyVariants({ variant: resolvedVariant }), className),
      ...props,
    },
    children,
  )
}
