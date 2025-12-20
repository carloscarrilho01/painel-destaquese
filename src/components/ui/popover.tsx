'use client'

import * as React from "react"

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  children: React.ReactNode
}

const Popover = ({ open, onOpenChange, children }: PopoverProps) => {
  return (
    <div data-state={open ? "open" : "closed"}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { open, onOpenChange })
        }
        return child
      })}
    </div>
  )
}

const PopoverTrigger = ({ children, open, onOpenChange, asChild }: any) => {
  if (asChild) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange?.(!open)
    })
  }

  return (
    <button onClick={() => onOpenChange?.(!open)}>
      {children}
    </button>
  )
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className = "", align = "center", children, ...props }: any, ref) => {
    const { open, onOpenChange } = props

    React.useEffect(() => {
      if (!open) return

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (ref && 'current' in ref && ref.current && !ref.current.contains(target)) {
          onOpenChange?.(false)
        }
      }

      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [open, onOpenChange])

    if (!open) return null

    const alignmentClasses: Record<string, string> = {
      start: "left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "right-0"
    }

    return (
      <div
        ref={ref}
        className={`absolute z-50 mt-2 bg-white rounded-md border border-gray-200 shadow-lg ${alignmentClasses[align] || alignmentClasses.center} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
