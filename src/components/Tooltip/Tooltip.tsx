import {
  cloneElement,
  isValidElement,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  /** When false, the tooltip is inactive and children render unchanged. */
  active?: boolean
  placement?: TooltipPlacement
  className?: string
}

const TOOLTIP_GAP = 8
const VIEWPORT_PADDING = 8
const TOOLTIP_Z_INDEX = 100

type Side = 'top' | 'bottom' | 'left' | 'right'
type Align = 'center' | 'start' | 'end'

function wrapsDisabledElement(child: ReactNode) {
  return (
    isValidElement(child) &&
    typeof child.props === 'object' &&
    child.props !== null &&
    'disabled' in child.props &&
    Boolean((child.props as { disabled?: boolean }).disabled)
  )
}

function wrapTrigger(child: ReactNode) {
  if (!wrapsDisabledElement(child)) return child

  return (
    <span className="inline-flex" tabIndex={0}>
      {child}
    </span>
  )
}

function parsePlacement(placement: TooltipPlacement): { side: Side; align: Align } {
  const [side, alignPart] = placement.split('-') as [Side, string?]
  const align =
    alignPart === 'start' ? 'start' : alignPart === 'end' ? 'end' : 'center'
  return { side, align }
}

function resolveVerticalSide(
  preferred: 'top' | 'bottom',
  triggerRect: DOMRect,
  tooltipHeight: number,
): 'top' | 'bottom' {
  const spaceAbove = triggerRect.top
  const spaceBelow = window.innerHeight - triggerRect.bottom

  if (preferred === 'top') {
    if (spaceAbove >= tooltipHeight + TOOLTIP_GAP) return 'top'
    if (spaceBelow >= tooltipHeight + TOOLTIP_GAP) return 'bottom'
    return spaceBelow >= spaceAbove ? 'bottom' : 'top'
  }

  if (spaceBelow >= tooltipHeight + TOOLTIP_GAP) return 'bottom'
  if (spaceAbove >= tooltipHeight + TOOLTIP_GAP) return 'top'
  return spaceAbove >= spaceBelow ? 'top' : 'bottom'
}

function resolveHorizontalSide(
  preferred: 'left' | 'right',
  triggerRect: DOMRect,
  tooltipWidth: number,
): 'left' | 'right' {
  const spaceLeft = triggerRect.left
  const spaceRight = window.innerWidth - triggerRect.right

  if (preferred === 'left') {
    if (spaceLeft >= tooltipWidth + TOOLTIP_GAP) return 'left'
    if (spaceRight >= tooltipWidth + TOOLTIP_GAP) return 'right'
    return spaceRight >= spaceLeft ? 'right' : 'left'
  }

  if (spaceRight >= tooltipWidth + TOOLTIP_GAP) return 'right'
  if (spaceLeft >= tooltipWidth + TOOLTIP_GAP) return 'left'
  return spaceLeft >= spaceRight ? 'left' : 'right'
}

function clampHorizontal(left: number, width: number) {
  const maxLeft = window.innerWidth - VIEWPORT_PADDING - width
  return Math.min(Math.max(left, VIEWPORT_PADDING), Math.max(maxLeft, VIEWPORT_PADDING))
}

function clampVertical(top: number, height: number) {
  const maxTop = window.innerHeight - VIEWPORT_PADDING - height
  return Math.min(Math.max(top, VIEWPORT_PADDING), Math.max(maxTop, VIEWPORT_PADDING))
}

function computePosition(
  triggerRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  placement: TooltipPlacement,
) {
  const { side: preferredSide, align } = parsePlacement(placement)
  let side = preferredSide

  if (side === 'top' || side === 'bottom') {
    side = resolveVerticalSide(side, triggerRect, tooltipHeight)
  } else {
    side = resolveHorizontalSide(side, triggerRect, tooltipWidth)
  }

  let top = 0
  let left = 0

  if (side === 'bottom') {
    top = triggerRect.bottom + TOOLTIP_GAP
    if (align === 'start') left = triggerRect.left
    else if (align === 'end') left = triggerRect.right - tooltipWidth
    else left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2
    left = clampHorizontal(left, tooltipWidth)
    top = clampVertical(top, tooltipHeight)
  } else if (side === 'top') {
    top = triggerRect.top - TOOLTIP_GAP - tooltipHeight
    if (align === 'start') left = triggerRect.left
    else if (align === 'end') left = triggerRect.right - tooltipWidth
    else left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2
    left = clampHorizontal(left, tooltipWidth)
    top = clampVertical(top, tooltipHeight)
  } else if (side === 'right') {
    left = triggerRect.right + TOOLTIP_GAP
    if (align === 'start') top = triggerRect.top
    else if (align === 'end') top = triggerRect.bottom - tooltipHeight
    else top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2
    left = clampHorizontal(left, tooltipWidth)
    top = clampVertical(top, tooltipHeight)
  } else {
    left = triggerRect.left - TOOLTIP_GAP - tooltipWidth
    if (align === 'start') top = triggerRect.top
    else if (align === 'end') top = triggerRect.bottom - tooltipHeight
    else top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2
    left = clampHorizontal(left, tooltipWidth)
    top = clampVertical(top, tooltipHeight)
  }

  return { top, left, side }
}

export function Tooltip({
  content,
  children,
  active = true,
  placement = 'top',
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [resolvedSide, setResolvedSide] = useState<Side>('top')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tooltipId = useId()
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return

    function updatePosition() {
      const trigger = triggerRef.current
      const tooltip = tooltipRef.current
      if (!trigger) return

      const triggerRect = trigger.getBoundingClientRect()
      const tooltipWidth = tooltip?.offsetWidth ?? 240
      const tooltipHeight = tooltip?.offsetHeight ?? 40

      const next = computePosition(triggerRect, tooltipWidth, tooltipHeight, placement)
      setResolvedSide(next.side)
      setPosition({ top: next.top, left: next.left })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, placement, content])

  if (!active) {
    return children
  }

  const child = wrapTrigger(children)

  const trigger =
    isValidElement(child) && !wrapsDisabledElement(children)
      ? cloneElement(child as ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': open ? tooltipId : undefined,
        })
      : child

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('inline-flex', className)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {trigger}
      </span>
      {open
        ? createPortal(
            <span
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              data-placement={`${resolvedSide}${parsePlacement(placement).align === 'center' ? '' : `-${parsePlacement(placement).align}`}`}
              style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                zIndex: TOOLTIP_Z_INDEX,
              }}
              className="pointer-events-none w-max max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-sm leading-snug text-foreground shadow-lg"
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </>
  )
}
