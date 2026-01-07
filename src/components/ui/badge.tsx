import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25",
        warning:
          "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25",
        info:
          "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25",
        // Plan variants
        "plan-free":
          "border-transparent bg-[oklch(0.744_0.16_126.36/0.15)] text-[oklch(0.65_0.16_126.36)] dark:text-[oklch(0.78_0.18_126.36)]",
        "plan-pro":
          "border-transparent bg-[oklch(0.55_0.22_260/0.15)] text-[oklch(0.45_0.22_260)] dark:text-[oklch(0.65_0.20_260)]",
        "plan-teams":
          "border-transparent bg-[oklch(0.55_0.25_300/0.15)] text-[oklch(0.45_0.25_300)] dark:text-[oklch(0.65_0.22_300)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  asChild?: boolean
  icon?: React.ReactNode
}

function Badge({ className, variant, asChild = false, icon, children, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && <span className="mr-1.5 flex shrink-0 items-center justify-center">{icon}</span>}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
