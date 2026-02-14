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
import { FeatureGuard } from "@/components/ui/feature-guard"

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
    /** If true, this action remains enabled even when the project is inactive (read-only).
     *  By default, ALL actions are disabled in inactive projects. */
    allowInReadOnly?: boolean
    /** Optional feature guard for plan-gated actions */
    featureGuard?: {
        /** Whether the feature is enabled (user has access) */
        isEnabled: boolean
        /** Name of the feature being guarded */
        featureName: string
        /** Required plan to access the feature */
        requiredPlan?: "PRO" | "ENTERPRISE"
        /** Custom message to show when blocked */
        customMessage?: string
    }
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
    const Icon = mainAction.icon
    const isGuarded = mainAction.featureGuard && !mainAction.featureGuard.isEnabled

    // Wrapper component for FeatureGuard
    const MainButton = (
        <ToolbarButton
            variant={mainAction.variant || "default"}
            onClick={mainAction.onClick}
            disabled={mainAction.disabled || isGuarded}
            className={!secondaryActions || secondaryActions.length === 0 ? className : "rounded-r-sm focus:z-10"}
        >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {mainAction.label}
        </ToolbarButton>
    )

    // Wrap with FeatureGuard if needed
    const GuardedMainButton = mainAction.featureGuard ? (
        <FeatureGuard
            isEnabled={mainAction.featureGuard.isEnabled}
            featureName={mainAction.featureGuard.featureName}
            requiredPlan={mainAction.featureGuard.requiredPlan}
            customMessage={mainAction.featureGuard.customMessage}
        >
            {MainButton}
        </FeatureGuard>
    ) : MainButton

    // If no secondary actions, just render the main button (possibly guarded)
    if (!secondaryActions || secondaryActions.length === 0) {
        return GuardedMainButton
    }

    // Render Split Button
    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {/* Main Action Part - Wrapped in FeatureGuard if needed */}
            {GuardedMainButton}

            {/* Dropdown Part */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <ToolbarButton
                        variant={mainAction.variant || "default"}
                        className="rounded-l-sm px-2 focus:z-10"
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
