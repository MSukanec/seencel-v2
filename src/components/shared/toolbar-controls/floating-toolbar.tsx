"use client";

/**
 * FloatingToolbar — Barra flotante centrada abajo para vistas full-screen
 *
 * Componente compartido para mapas, canvas, editores y cualquier vista
 * que necesite controles de navegación flotantes.
 *
 * Estética: glassmorphism oscuro, centrada abajo, pill shape.
 * Se usa en: Mapa de Ubicaciones, Canvas PDF, etc.
 */

import * as React from "react";
import { Minus, Plus, Maximize, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ───────────────────────────────────────────────

export interface FloatingToolbarAction {
    /** Icon to display */
    icon: LucideIcon;
    /** Tooltip label */
    label: string;
    /** Click handler */
    onClick: () => void;
    /** Disabled state */
    disabled?: boolean;
}

interface FloatingToolbarProps {
    /** Custom action buttons */
    actions?: FloatingToolbarAction[];
    /** Additional className for the container */
    className?: string;
}

// ─── Zoom controls ──────────────────────────────────────

interface FloatingToolbarZoomProps extends FloatingToolbarProps {
    /** Current zoom level (0-1 scale, e.g., 0.6 = 60%) */
    zoom?: number;
    /** Callback when zoom in is clicked */
    onZoomIn?: () => void;
    /** Callback when zoom out is clicked */
    onZoomOut?: () => void;
    /** Callback when fit-to-screen is clicked */
    onFitToScreen?: () => void;
}

// ─── Component ───────────────────────────────────────────

export function FloatingToolbar({
    zoom,
    onZoomIn,
    onZoomOut,
    onFitToScreen,
    actions = [],
    className,
}: FloatingToolbarZoomProps) {
    const hasZoom = onZoomIn || onZoomOut;
    const hasActions = actions.length > 0;

    return (
        <TooltipProvider delayDuration={300}>
            <div
                className={cn(
                    "absolute bottom-4 left-1/2 -translate-x-1/2 z-50",
                    "flex items-center gap-0.5",
                    "bg-black/70 backdrop-blur-md",
                    "px-1.5 py-1 rounded-full",
                    "border border-white/10",
                    "shadow-2xl shadow-black/30",
                    "transition-opacity duration-200",
                    className,
                )}
            >
                {/* Zoom controls */}
                {hasZoom && (
                    <>
                        <ToolbarButton
                            icon={Minus}
                            label="Alejar"
                            onClick={onZoomOut!}
                        />
                        {zoom !== undefined && (
                            <span className="text-[10px] font-mono text-white/70 w-10 text-center tabular-nums select-none">
                                {Math.round(zoom * 100)}%
                            </span>
                        )}
                        <ToolbarButton
                            icon={Plus}
                            label="Acercar"
                            onClick={onZoomIn!}
                        />
                    </>
                )}

                {/* Fit to screen */}
                {onFitToScreen && (
                    <>
                        {hasZoom && <ToolbarSeparator />}
                        <ToolbarButton
                            icon={Maximize}
                            label="Ajustar a pantalla"
                            onClick={onFitToScreen}
                            iconSize="h-3 w-3"
                        />
                    </>
                )}

                {/* Custom actions */}
                {hasActions && (
                    <>
                        {(hasZoom || onFitToScreen) && <ToolbarSeparator />}
                        {actions.map((action, i) => (
                            <ToolbarButton
                                key={i}
                                icon={action.icon}
                                label={action.label}
                                onClick={action.onClick}
                                disabled={action.disabled}
                            />
                        ))}
                    </>
                )}
            </div>
        </TooltipProvider>
    );
}

// ─── Internal components ─────────────────────────────────

function ToolbarButton({
    icon: Icon,
    label,
    onClick,
    disabled,
    iconSize = "h-3.5 w-3.5",
}: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    iconSize?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-7 w-7 rounded-full",
                        "text-white/70 hover:text-white hover:bg-white/20",
                        "transition-colors cursor-pointer",
                        disabled && "opacity-30 pointer-events-none",
                    )}
                    onClick={onClick}
                    disabled={disabled}
                >
                    <Icon className={iconSize} />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
                {label}
            </TooltipContent>
        </Tooltip>
    );
}

function ToolbarSeparator() {
    return <div className="w-[1px] h-4 bg-white/15 mx-0.5" />;
}
