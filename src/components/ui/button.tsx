import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-100 disabled:bg-gray-200 disabled:text-gray-700 disabled:border-gray-400 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-blue-800 text-white hover:bg-blue-900 active:bg-blue-900',
        destructive: 'bg-red-800 text-white hover:bg-red-900 active:bg-red-900',
        outline: 'border-2 border-gray-300 bg-white hover:bg-gray-100 active:bg-gray-200',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
        ghost: 'hover:bg-gray-100 active:bg-gray-200',
        success: 'bg-green-800 text-white hover:bg-green-900 active:bg-green-900',
        warning: 'bg-amber-900 text-white hover:bg-amber-950 active:bg-amber-950',
      },
      size: {
        default: 'h-12 px-5 max-sm:px-3 py-3 max-sm:py-2 text-base sm:text-lg',
        sm: 'h-12 px-4 max-sm:px-3 py-3 max-sm:py-2 text-sm sm:text-base',
        lg: 'h-14 px-8 max-sm:px-3 py-4 max-sm:py-2 text-base sm:text-lg',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
