"use client";

import { usePanel, type PanelFooterConfig } from "@/stores/panel-store";
import { PANEL_REGISTRY } from "@/stores/panel-registry";
import { PanelUrlSynchronizer } from "@/stores/panel-url-sync";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useRef } from "react";
import { X, ChevronLeft, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const sizeClasses: Record<string, string> = {
    sm: "sm:max-w-[400px]",
    md: "sm:max-w-[550px]",
    lg: "sm:max-w-[750px]",
    xl: "sm:max-w-[900px]",
};

export const PanelProvider = () => {
    const { stack, closePanel } = usePanel();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Close panel on Escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape" && stack.length > 0) {
            e.preventDefault();
            closePanel();
        }
    }, [stack.length, closePanel]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (!isMounted) return null;

    const topPanel = stack[stack.length - 1];
    const isOpen = stack.length > 0;

    return (
        <>
            <PanelUrlSynchronizer />
            <AnimatePresence>
                {isOpen && topPanel && (
                    <>
                        {/* Overlay — soft: allows seeing content, blocks clicks */}
                        {topPanel.overlay !== false && (
                            <motion.div
                                key="panel-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
                                onClick={() => closePanel()}
                            />
                        )}

                        {/* Panel Container */}
                        <motion.div
                            key={topPanel.id}
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{
                                type: "spring",
                                damping: 30,
                                stiffness: 300,
                                mass: 0.8,
                            }}
                            className={cn(
                                "fixed z-50 bg-background shadow-2xl border-l flex flex-col",
                                // Mobile: full screen
                                "inset-0 w-full",
                                // Desktop: side panel from right
                                "sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full",
                                sizeClasses[topPanel.size || "md"]
                            )}
                        >
                            {/* Header */}
                            <div className="flex-none flex items-center justify-between gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                    {/* Back button when stacked */}
                                    {stack.length > 1 && (
                                        <button
                                            onClick={() => closePanel()}
                                            className="rounded-md p-1 hover:bg-muted transition-colors"
                                            aria-label="Volver"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                    )}
                                    {/* Icon */}
                                    {topPanel.icon && (() => {
                                        const IconComponent = topPanel.icon;
                                        return <IconComponent className="h-5 w-5 text-primary flex-none" />;
                                    })()}
                                    <div className="min-w-0">
                                        {topPanel.title && (
                                            <h2 className="text-sm font-medium text-foreground truncate">
                                                {topPanel.title}
                                            </h2>
                                        )}
                                        {topPanel.description && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {topPanel.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => closePanel()}
                                    aria-label="Cerrar panel"
                                    className="rounded-md p-1.5 hover:bg-muted transition-colors flex-none"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Body — scrollable, contains the form */}
                            <div className="flex-1 flex flex-col relative min-h-0 overflow-y-auto p-4">
                                <PanelContent panel={topPanel} />
                            </div>

                            {/* Footer — rendered by the container */}
                            {topPanel.footer && (
                                <PanelFooter
                                    config={topPanel.footer}
                                    formId={topPanel.formId}
                                    isSubmitting={topPanel.isSubmitting ?? false}
                                    onCancel={() => closePanel()}
                                />
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

// ============================================================================
// Panel Content — resolves component from registry
// ============================================================================

function PanelContent({ panel }: { panel: { panelId: string; formId: string; props?: Record<string, unknown> } }) {
    const registryItem = PANEL_REGISTRY[panel.panelId];

    if (!registryItem) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                Panel &quot;{panel.panelId}&quot; no registrado.
            </div>
        );
    }

    const Component = registryItem.component;
    // Pass formId as prop so the form can use <form id={formId}>
    return <Component {...(panel.props || {})} formId={panel.formId} />;
}

// ============================================================================
// Panel Footer — container-managed footer
// ============================================================================

interface PanelFooterProps {
    config: PanelFooterConfig;
    formId: string;
    isSubmitting: boolean;
    onCancel: () => void;
}

function PanelFooter({ config, formId, isSubmitting, onCancel }: PanelFooterProps) {
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    // Cmd+Enter shortcut to submit
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (!isSubmitting && submitBtnRef.current) {
                    e.preventDefault();
                    submitBtnRef.current.click();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSubmitting]);

    // Case 1: Custom footer override
    if (config.customFooter) {
        return (
            <div className="flex-none p-3 border-t border-border bg-background">
                {config.customFooter}
            </div>
        );
    }

    // Case 2: Multi-action buttons
    if (config.actions && config.actions.length > 0) {
        return (
            <div className="flex-none p-3 border-t border-border bg-background">
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        {config.cancelLabel || "Cancelar"}
                    </Button>
                    {config.actions.map((action, index) => (
                        <Button
                            key={index}
                            variant={action.variant || "default"}
                            type="button"
                            onClick={action.onClick}
                            disabled={action.disabled || action.isLoading}
                        >
                            {action.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {action.label}
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    // Case 3: Standard Cancel + Submit (or Cancel-only if no submitLabel)
    const cancelLabel = config.cancelLabel || "Cancelar";

    // Cancel-only mode: no submitLabel → full-width Cancel
    if (!config.submitLabel) {
        return (
            <div className="flex-none p-3 border-t border-border bg-background">
                <Button
                    variant="outline"
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="w-full"
                >
                    {cancelLabel}
                </Button>
            </div>
        );
    }

    // Cancel + Submit: 25%/75% grid
    return (
        <div className="flex-none p-3 border-t border-border bg-background">
            <div className="grid grid-cols-4 gap-3">
                <Button
                    variant="outline"
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="w-full col-span-1"
                >
                    {cancelLabel}
                </Button>
                <Button
                    ref={submitBtnRef}
                    type="submit"
                    form={formId}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="w-full col-span-3"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {config.submitLabel}
                </Button>
            </div>
        </div>
    );
}
