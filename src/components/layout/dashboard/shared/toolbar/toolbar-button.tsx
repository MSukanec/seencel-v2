"use client";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"
import { ChevronDown, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// --- ToolbarButton (Replacement for Shadcn Button) ---
function ToolbarButton({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

// --- ToolbarSplitButton (Main Action + Secondary Actions) ---

export interface ToolbarAction {
    label: string
    onClick: () => void
    icon?: React.ComponentType<{ className?: string }>
    variant?: VariantProps<typeof buttonVariants>["variant"]
    disabled?: boolean
}

interface ToolbarSplitButtonProps {
    mainAction: ToolbarAction
    secondaryActions: ToolbarAction[]
    /** If true, renders "..." instead of a chevron, commonly for 'more actions' */
    useMoreIcon?: boolean
    className?: string
}

function ToolbarSplitButton({
    mainAction,
    secondaryActions,
    useMoreIcon = true,
    className,
}: ToolbarSplitButtonProps) {
    // If no secondary actions, just render the main button
    if (!secondaryActions || secondaryActions.length === 0) {
        const Icon = mainAction.icon
        return (
            <ToolbarButton
                variant={mainAction.variant || "default"}
                onClick={mainAction.onClick}
                disabled={mainAction.disabled}
                className={className}
            >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {mainAction.label}
            </ToolbarButton>
        )
    }

    // Render Split Button
    const Icon = mainAction.icon

    return (
        <div className={cn("flex items-center rounded-md shadow-sm", className)}>
            {/* Main Action Part */}
            <ToolbarButton
                variant={mainAction.variant || "default"}
                onClick={mainAction.onClick}
                disabled={mainAction.disabled}
                className="rounded-r-none border-r border-r-primary-foreground/20 focus:z-10"
            >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {mainAction.label}
            </ToolbarButton>

            {/* Dropdown Part */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <ToolbarButton
                        variant={mainAction.variant || "default"}
                        className="rounded-l-none px-2 focus:z-10"
                        disabled={mainAction.disabled}
                    >
                        {useMoreIcon ? (
                            <MoreHorizontal className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="sr-only">Más opciones</span>
                    </ToolbarButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {secondaryActions.map((action, index) => {
                        const ActionIcon = action.icon
                        return (
                            <DropdownMenuItem
                                key={index}
                                onClick={action.onClick}
                                disabled={action.disabled}
                                className="cursor-pointer"
                            >
                                {ActionIcon && <ActionIcon className="mr-2 h-4 w-4 text-muted-foreground" />}
                                {action.label}
                            </DropdownMenuItem>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export { ToolbarButton, ToolbarSplitButton }
