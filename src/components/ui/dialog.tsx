'use client'

import * as React from "react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
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

const DialogTrigger = ({ children, open, onOpenChange }: any) => {
  return React.cloneElement(children, {
    onClick: () => onOpenChange?.(!open)
  })
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = "", children, ...props }: any, ref) => {
    const { open, onOpenChange } = props

    if (!open) return null

    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => onOpenChange?.(false)}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            ref={ref}
            className={`relative bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto ${className}`}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {children}
          </div>
        </div>
      </>
    )
  }
)

DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
)

const DialogFooter = ({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex justify-end space-x-2 p-6 pt-0 ${className}`} {...props} />
)

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h2 ref={ref} className={`text-lg font-semibold ${className}`} {...props} />
  )
)

DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", ...props }, ref) => (
    <p ref={ref} className={`text-sm text-gray-500 ${className}`} {...props} />
  )
)

DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
