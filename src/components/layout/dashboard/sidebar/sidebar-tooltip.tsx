"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Medal, Lock, EyeOff, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// SIDEBAR TOOLTIP — Shared singleton tooltip with Framer Motion morphing
// ============================================================================
// Architecture:
//   - SidebarTooltipProvider: wraps the sidebar, owns the single tooltip portal
//   - SidebarTooltip: wrapper for each nav item, registers hover in the shared context
//   - Uses framer-motion layoutId for smooth position morphing between items
//   - Speech-bubble style with caret pointing left
// ============================================================================

export type SidebarRestriction = "founders" | "maintenance" | "hidden" | null;

// --- Restriction visual config ---
const restrictionConfig = {
    founders: {
        icon: Medal,
        iconClass: "text-slate-400",
        bgClass: "bg-slate-400/10",
        text: "Acceso anticipado para fundadores.",
        linkHref: "/founders" as any,
        linkText: "Conocer más",
        linkClass: "text-slate-400 hover:text-slate-300",
    },
    maintenance: {
        icon: Lock,
        iconClass: "text-semantic-warning",
        bgClass: "bg-semantic-warning/10",
        text: "En mantenimiento. Estará disponible pronto.",
        linkHref: null,
        linkText: null,
        linkClass: null,
    },
    hidden: {
        icon: EyeOff,
        iconClass: "text-muted-foreground",
        bgClass: "bg-muted",
        text: "Oculto para usuarios. Solo visible para administradores.",
        linkHref: null,
        linkText: null,
        linkClass: null,
    },
};

// --- Shared context for the singleton tooltip ---
interface TooltipState {
    label: string;
    restriction: SidebarRestriction;
    top: number;
    left: number;
}

interface TooltipContextValue {
    show: (state: TooltipState) => void;
    hide: () => void;
    keepAlive: () => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

// =============================================================================
// PROVIDER — Wraps the sidebar, renders the single tooltip portal
// =============================================================================
export function SidebarTooltipProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = React.useState<TooltipState | null>(null);
    const [isVisible, setIsVisible] = React.useState(false);
    const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = React.useCallback((newState: TooltipState) => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setState(newState);
        setIsVisible(true);
    }, []);

    const hide = React.useCallback(() => {
        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 80);
    }, []);

    const keepAlive = React.useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    }, []);

    const contextValue = React.useMemo(() => ({ show, hide, keepAlive }), [show, hide, keepAlive]);

    const config = state?.restriction ? restrictionConfig[state.restriction] : null;
    const RestrictionIcon = config?.icon;

    return (
        <TooltipContext.Provider value={contextValue}>
            {children}

            {/* Single shared tooltip portal */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isVisible && state && (
                        <motion.div
                            key="sidebar-tooltip"
                            className="fixed z-[200] pointer-events-auto"
                            initial={{ opacity: 0, x: -4 }}
                            animate={{
                                opacity: 1,
                                x: 0,
                                top: state.top,
                                left: state.left,
                            }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{
                                top: { type: "spring", stiffness: 400, damping: 30 },
                                left: { type: "spring", stiffness: 400, damping: 30 },
                                opacity: { duration: 0.12 },
                                x: { duration: 0.12 },
                            }}
                            style={{ transform: "translateY(-50%)" }}
                            onMouseEnter={keepAlive}
                            onMouseLeave={hide}
                        >
                            {/* Caret / Arrow — speech bubble pointer */}
                            <div
                                className="absolute right-full top-1/2 -translate-y-1/2"
                                style={{ marginRight: "-1px" }}
                            >
                                <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-popover" />
                            </div>

                            {/* Bubble content */}
                            <motion.div
                                layout
                                className={cn(
                                    "bg-popover border border-border rounded-xl shadow-xl",
                                    "px-3 py-2",
                                    state.restriction ? "min-w-[180px] max-w-[220px]" : "whitespace-nowrap",
                                )}
                                transition={{ layout: { type: "spring", stiffness: 400, damping: 30 } }}
                            >
                                {/* Page name */}
                                <p className="text-xs font-semibold text-popover-foreground">
                                    {state.label}
                                </p>

                                {/* Restriction info */}
                                <AnimatePresence mode="wait">
                                    {config && RestrictionIcon && (
                                        <motion.div
                                            key={state.restriction}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="mt-1.5 pt-1.5 border-t border-border/50"
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={cn(
                                                    "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                                    config.bgClass
                                                )}>
                                                    <RestrictionIcon className={cn("h-2.5 w-2.5", config.iconClass)} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                        {config.text}
                                                    </p>
                                                    {config.linkHref && config.linkText && (
                                                        <Link
                                                            href={config.linkHref}
                                                            className={cn(
                                                                "text-[11px] font-medium flex items-center gap-0.5 mt-1",
                                                                config.linkClass
                                                            )}
                                                        >
                                                            {config.linkText} <ChevronRight className="h-3 w-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </TooltipContext.Provider>
    );
}

// =============================================================================
// TOOLTIP WRAPPER — Wraps each nav item, registers hover in the shared context
// =============================================================================
interface SidebarTooltipProps {
    label: string;
    restriction?: SidebarRestriction;
    isExpanded?: boolean;
    children: React.ReactNode;
}

export function SidebarTooltip({
    label,
    restriction,
    isExpanded = false,
    children,
}: SidebarTooltipProps) {
    const ctx = React.useContext(TooltipContext);
    const triggerRef = React.useRef<HTMLDivElement>(null);

    // Show tooltip: only when collapsed, or when item has a restriction
    const shouldShow = !isExpanded || !!restriction;
    if (!shouldShow) return <>{children}</>;

    const handleMouseEnter = () => {
        if (!ctx || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        ctx.show({
            label,
            restriction: restriction ?? null,
            top: rect.top + rect.height / 2,
            left: rect.right + 12,
        });
    };

    const handleMouseLeave = () => {
        ctx?.hide();
    };

    return (
        <div
            ref={triggerRef}
            className="w-full"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
}
