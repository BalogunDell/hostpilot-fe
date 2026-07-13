import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useActionsDisabled } from '../../context/AppContext'
import { cn } from '../../lib/cn'

export interface DropdownItem {
  label: string
  value: string
  onSelect: () => void
  disabled?: boolean
}

export interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'start' | 'end'
  className?: string
}

const MENU_WIDTH = 176

export function Dropdown({
  trigger,
  items,
  align = 'start',
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const actionsDisabled = useActionsDisabled()

  const close = useCallback(() => {
    setOpen(false)
    setActiveIndex(0)
  }, [])

  const updateMenuPosition = useCallback(() => {
    const triggerEl = triggerRef.current
    if (!triggerEl) return

    const rect = triggerEl.getBoundingClientRect()
    const left =
      align === 'end'
        ? Math.max(8, rect.right - MENU_WIDTH)
        : Math.min(window.innerWidth - MENU_WIDTH - 8, rect.left)

    setMenuPosition({
      top: rect.bottom + 8,
      left,
    })
  }, [align])

  useEffect(() => {
    if (!open) return

    updateMenuPosition()

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        containerRef.current?.contains(target) ||
        document.getElementById(menuId)?.contains(target)
      ) {
        return
      }
      close()
    }

    function handleScroll() {
      updateMenuPosition()
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, close, menuId, updateMenuPosition])

  function handleKeyDown(event: KeyboardEvent) {
    if (!open) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault()
        updateMenuPosition()
        setOpen(true)
      }
      return
    }

    const enabledIndexes = items
      .map((item, index) => (item.disabled || actionsDisabled ? -1 : index))
      .filter((index) => index >= 0)

    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const currentPos = enabledIndexes.indexOf(activeIndex)
      const nextPos = (currentPos + 1) % enabledIndexes.length
      setActiveIndex(enabledIndexes[nextPos] ?? 0)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const currentPos = enabledIndexes.indexOf(activeIndex)
      const nextPos =
        (currentPos - 1 + enabledIndexes.length) % enabledIndexes.length
      setActiveIndex(enabledIndexes[nextPos] ?? 0)
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const item = items[activeIndex]
      if (item && !item.disabled && !actionsDisabled) {
        item.onSelect()
        close()
      }
    }
  }

  const menu = open
    ? createPortal(
        <ul
          id={menuId}
          role="menu"
          style={{ top: menuPosition.top, left: menuPosition.left, width: MENU_WIDTH }}
          className="fixed z-[200] overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {items.map((item, index) => (
            <li key={item.value} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled || actionsDisabled}
                className={cn(
                  'flex min-h-10 w-full items-center rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors',
                  'hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                  'disabled:pointer-events-none disabled:opacity-50',
                  index === activeIndex && 'bg-accent',
                )}
                onClick={() => {
                  item.onSelect()
                  close()
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )
    : null

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex', className)}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex disabled:pointer-events-none disabled:opacity-50"
        disabled={actionsDisabled}
        onClick={() => {
          if (!open) updateMenuPosition()
          setOpen((value) => !value)
        }}
      >
        {trigger}
      </button>
      {menu}
    </div>
  )
}
