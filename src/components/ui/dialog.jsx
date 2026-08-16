"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    style={{
      background: 'rgba(46,42,38,0.25)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      transition: 'backdrop-filter 0.3s ease, background 0.3s ease',
    }}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 grid w-full max-w-lg gap-4 p-6 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "top-[5%] left-[50%] -translate-x-1/2 w-[calc(100%-24px)] sm:top-[50%] sm:-translate-y-1/2 sm:w-full",
        className
      )}
      style={{
        background: '#eeeae6',
        borderRadius: 20,
        border: 'none',
        boxShadow: 'none',
        maxHeight: '90dvh',
        overflowY: 'auto',
      }}
      {...props}>
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 focus:outline-none disabled:pointer-events-none"
        style={{
          width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#eeeae6',
          boxShadow: '-4px -4px 8px rgba(255,250,244,0.82), 4px 4px 10px rgba(160,143,126,0.30)',
          color: '#5a5a5a', border: 'none', cursor: 'pointer',
          transition: 'box-shadow 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '-6px -6px 12px rgba(255,250,244,0.9), 6px 6px 14px rgba(160,143,126,0.38)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '-4px -4px 8px rgba(255,250,244,0.82), 4px 4px 10px rgba(160,143,126,0.30)'; }}>
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}