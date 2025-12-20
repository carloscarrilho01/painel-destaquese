'use client'

import * as React from "react"

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
  children: React.ReactNode
}

const Popover = ({ open, onOpenChange, children }: PopoverProps) => {
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)

  return (
    <div data-state={open ? "open" : "closed"} className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps: any = {
            open,
            onOpenChange,
            triggerRect,
            setTriggerRect,
            triggerRef
          }
          return React.cloneElement(child as React.ReactElement<any>, childProps)
        }
        return child
      })}
    </div>
  )
}

const PopoverTrigger = ({ children, open, onOpenChange, asChild, setTriggerRect, triggerRef }: any) => {
  const handleClick = (e: React.MouseEvent) => {
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect())
    }
    onOpenChange?.(!open)
  }

  if (asChild) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: handleClick
    })
  }

  return (
    <button ref={triggerRef} onClick={handleClick}>
      {children}
    </button>
  )
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className = "", align = "center", side = "bottom", sideOffset = 0, children, ...props }: any, ref) => {
    const { open, onOpenChange, triggerRect } = props
    const [position, setPosition] = React.useState({ top: 0, left: 0 })

    React.useEffect(() => {
      if (!open || !triggerRect) return

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (ref && 'current' in ref && ref.current && !ref.current.contains(target)) {
          // Verificar se clicou no trigger
          const triggerElement = document.querySelector('[data-state="open"]')
          if (triggerElement && !triggerElement.contains(target)) {
            onOpenChange?.(false)
          }
        }
      }

      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [open, onOpenChange, triggerRect])

    React.useEffect(() => {
      if (open && triggerRect && ref && 'current' in ref && ref.current) {
        const contentRect = ref.current.getBoundingClientRect()
        let top = 0
        let left = 0

        // Calcular posição vertical (side)
        if (side === 'top') {
          top = triggerRect.top - contentRect.height - sideOffset
        } else if (side === 'bottom') {
          top = triggerRect.bottom + sideOffset
        } else if (side === 'left') {
          top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
        } else if (side === 'right') {
          top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
        }

        // Calcular posição horizontal (align)
        if (align === 'start') {
          left = triggerRect.left
        } else if (align === 'center') {
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
        } else if (align === 'end') {
          left = triggerRect.right - contentRect.width
        }

        // Ajustar para side left/right
        if (side === 'left') {
          left = triggerRect.left - contentRect.width - sideOffset
        } else if (side === 'right') {
          left = triggerRect.right + sideOffset
        }

        setPosition({ top, left })
      }
    }, [open, triggerRect, align, side, sideOffset])

    if (!open) return null

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40"
          onClick={() => onOpenChange?.(false)}
        />
        {/* Content */}
        <div
          ref={ref}
          className={`fixed z-50 bg-white rounded-md border border-gray-200 shadow-lg ${className}`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {children}
        </div>
      </>
    )
  }
)

PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
