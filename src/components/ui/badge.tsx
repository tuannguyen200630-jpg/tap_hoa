import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-lg max-sm:text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-blue-100 text-blue-950',
        success: 'bg-emerald-100 text-emerald-900',
        warning: 'bg-amber-100 text-amber-950',
        destructive: 'bg-red-100 text-red-900',
        outline: 'border border-gray-300 text-gray-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
