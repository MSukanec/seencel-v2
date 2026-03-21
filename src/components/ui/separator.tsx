"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
    React.ElementRef<typeof SeparatorPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
            "shrink-0 border-none bg-transparent",
            orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
            className
        )}
        style={{
            boxShadow: orientation === "horizontal"
                ? "0 -1px 0 0 rgba(0,0,0,0.15), 0 1px 0 0 rgba(255,255,255,0.04)"
                : "-1px 0 0 0 rgba(0,0,0,0.15), 1px 0 0 0 rgba(255,255,255,0.04)",
        }}
        {...props}
    />
))
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }

