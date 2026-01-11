'use client'

import * as React from 'react'
import { cn } from '@/utils/cn'
import { Checkbox } from '@/components/ui/checkbox'

interface ToggleCheckboxProps {
  label?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

const ToggleCheckbox = React.forwardRef<
  HTMLDivElement,
  ToggleCheckboxProps
>(({ className, label, checked, onCheckedChange, ...props }, ref) => {
  return (
    <div className="flex items-start space-x-2" ref={ref}>
      <Checkbox
        id="not-a-robot"
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn("mt-0.5", className)}
        {...props}
      />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor="not-a-robot"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label || "I'm not a robot"}
        </label>
        <p className="text-xs text-muted-foreground">
          This helps protect our service from spam and abuse.
        </p>
      </div>
    </div>
  )
})
ToggleCheckbox.displayName = "ToggleCheckbox"

export { ToggleCheckbox }