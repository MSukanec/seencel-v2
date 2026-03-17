import * as React from "react"
import { cn } from "@/lib/utils"

export const cardVariants = {
    default: cn(
        "rounded-2xl border bg-card text-card-foreground transition-all duration-300",
        "border-t-border/60 border-x-border/30 border-b-border/20",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(255,255,255,0.02)_inset,0_2px_8px_-2px_rgba(0,0,0,0.3),0_1px_2px_-1px_rgba(0,0,0,0.2)]",
        "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_0_0_1px_rgba(255,255,255,0.03)_inset,0_4px_16px_-4px_rgba(0,0,0,0.4),0_2px_4px_-2px_rgba(0,0,0,0.25)]",
        "hover:border-t-border/80 hover:border-x-border/40",
    ),
    inset: cn(
        "rounded-xl bg-black/15 border border-white/[0.04] text-card-foreground px-2.5 py-2",
        "shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(0,0,0,0.2),inset_0_-1px_1px_rgba(255,255,255,0.03)]",
    ),
    island: cn(
        "cincel-island rounded-xl text-card-foreground",
    ),
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: keyof typeof cardVariants
}

const Card = React.forwardRef<
    HTMLDivElement,
    CardProps
>(({ className, variant = "default", ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            cardVariants[variant],
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

