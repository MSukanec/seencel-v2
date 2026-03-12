"use client";

import { usePanel, type PanelFooterConfig } from "@/stores/panel-store";
import { PANEL_REGISTRY } from "@/stores/panel-registry";
import { PanelUrlSynchronizer } from "@/stores/panel-url-sync";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useRef } from "react";
import { X, ChevronLeft, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/shared/kbd";

// ─── Size classes per mode ───────────────────────────────

const panelSizeClasses: Record<string, string> = {
    sm: "sm:max-w-[400px]",
    md: "sm:max-w-[550px]",
    lg: "sm:max-w-[750px]",
    xl: "sm:max-w-[900px]",
};

const modalSizeClasses: Record<string, string> = {
    sm: "max-w-[560px]",
    md: "max-w-[720px]",
    lg: "max-w-[920px]",
    xl: "max-w-[1080px]",
};

// ─── Animation variants ─────────────────────────────────

const panelVariants = {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
};

const modalVariants = {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 10 },
};

const panelTransition = {
    type: "spring" as const,
    damping: 30,
    stiffness: 300,
    mass: 0.8,
};

const modalTransition = {
    type: "spring" as const,
    damping: 25,
    stiffness: 350,
    mass: 0.6,
};

// ─── Success sound (Web Audio) ──────────────────────────

function playSuccessChime() {
    try {
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // Whisper-soft ascending tones
        [523, 659].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "triangle";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.02, now + i * 0.15 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.6);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.6);
        });

        setTimeout(() => ctx.close(), 1500);
    } catch {
        // Web Audio not available
    }
}

// ─── Animated Modal wrapper ─────────────────────────────

function SuccessAnimatedModal({
    topPanel,
    successFlash,
    closePanel,
    stack,
    children,
}: {
    topPanel: any;
    successFlash: boolean;
    closePanel: () => void;
    stack: any[];
    children: React.ReactNode;
}) {
    const [scope, animate] = useAnimate();
    const prevFlash = useRef(false);

    useEffect(() => {
        if (successFlash && !prevFlash.current) {
            playSuccessChime();

            // Magical success aura: layered green glow + gentle breathe
            animate(scope.current, {
                scale: [1, 1.006, 1],
                boxShadow: [
                    "0 0 0px 0px var(--semantic-positive, #69804a)",
                    "0 0 20px 3px color-mix(in srgb, var(--semantic-positive, #69804a) 30%, transparent), 0 0 60px 10px color-mix(in srgb, var(--semantic-positive, #69804a) 12%, transparent), 0 0 100px 20px color-mix(in srgb, var(--semantic-positive, #69804a) 5%, transparent)",
                    "0 0 30px 5px color-mix(in srgb, var(--semantic-positive, #69804a) 20%, transparent), 0 0 80px 15px color-mix(in srgb, var(--semantic-positive, #69804a) 8%, transparent)",
                    "0 0 0px 0px var(--semantic-positive, #69804a)",
                ],
            }, {
                duration: 1.2,
                ease: "easeInOut",
            });
        }
        prevFlash.current = successFlash;
    }, [successFlash, animate, scope]);

    return (
        <motion.div
            ref={scope}
            key={topPanel.id}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalTransition}
            className={cn(
                "pointer-events-auto w-full flex flex-col overflow-hidden",
                "rounded-xl shadow-2xl border border-border/50",
                "min-h-[50vh] max-h-[92vh] mx-4",
                modalSizeClasses[topPanel.size || "md"],
            )}
            style={{
                background: "linear-gradient(135deg, color-mix(in oklch, var(--sidebar), black 6%) 0%, var(--sidebar) 50%, color-mix(in oklch, var(--sidebar), white 8%) 100%)",
            }}
        >
            {children}
        </motion.div>
    );
}

// ─── Provider ────────────────────────────────────────────

export const PanelProvider = () => {
    const { stack, closePanel, successFlash } = usePanel();
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
    const mode = topPanel?.mode || "modal";

    return (
        <>
            <PanelUrlSynchronizer />
            <AnimatePresence>
                {isOpen && topPanel && (
                    <>
                        {/* Overlay */}
                        {topPanel.overlay !== false && (
                            <motion.div
                                key="panel-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "fixed inset-0 z-40",
                                    mode === "modal"
                                        ? "bg-black/50 backdrop-blur-[2px]"
                                        : "bg-black/30 backdrop-blur-[1px]"
                                )}
                                onClick={() => closePanel()}
                            />
                        )}

                        {mode === "modal" ? (
                            /* ─── Modal Mode: Centered ─────────────── */
                            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                                <SuccessAnimatedModal
                                    topPanel={topPanel}
                                    successFlash={successFlash}
                                    closePanel={closePanel}
                                    stack={stack}
                                >
                                    {/* Header */}
                                    <ModalHeader
                                        panel={topPanel}
                                        stackDepth={stack.length}
                                        onClose={closePanel}
                                    />

                                    {/* Body */}
                                    <div className="flex-1 overflow-y-auto p-5">
                                        <PanelContent panel={topPanel} />
                                    </div>

                                    {/* Footer */}
                                    {topPanel.footer && (
                                        <PanelFooter
                                            config={topPanel.footer}
                                            formId={topPanel.formId}
                                            isSubmitting={topPanel.isSubmitting ?? false}
                                            onCancel={() => closePanel()}
                                            mode="modal"
                                        />
                                    )}
                                </SuccessAnimatedModal>
                            </div>
                        ) : (
                            /* ─── Panel Mode: Right Drawer ─────────── */
                            <motion.div
                                key={topPanel.id}
                                variants={panelVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={panelTransition}
                                className={cn(
                                    "fixed z-50 bg-background shadow-2xl border-l flex flex-col",
                                    "inset-0 w-full",
                                    "sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full",
                                    panelSizeClasses[topPanel.size || "md"]
                                )}
                            >
                                {/* Header */}
                                <DrawerHeader
                                    panel={topPanel}
                                    stackDepth={stack.length}
                                    onClose={closePanel}
                                />

                                {/* Body */}
                                <div className="flex-1 flex flex-col relative min-h-0 overflow-y-auto p-4">
                                    <PanelContent panel={topPanel} />
                                </div>

                                {/* Footer */}
                                {topPanel.footer && (
                                    <PanelFooter
                                        config={topPanel.footer}
                                        formId={topPanel.formId}
                                        isSubmitting={topPanel.isSubmitting ?? false}
                                        onCancel={() => closePanel()}
                                        mode="panel"
                                    />
                                )}
                            </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

// ============================================================================
// Modal Header — compact, Linear-style
// ============================================================================

function ModalHeader({
    panel,
    stackDepth,
    onClose,
}: {
    panel: { icon?: any; title?: string; description?: string };
    stackDepth: number;
    onClose: () => void;
}) {
    return (
        <div className="flex-none flex items-center justify-between gap-3 px-5 py-3 border-b border-border/20">
            <div className="flex items-center gap-2 min-w-0">
                {stackDepth > 1 && (
                    <button
                        onClick={() => onClose()}
                        className="rounded-md p-1 hover:bg-muted/50 transition-colors"
                        aria-label="Volver"
                    >
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
                {panel.icon && (() => {
                    const IconComponent = panel.icon;
                    return <IconComponent className="h-4 w-4 text-muted-foreground flex-none" />;
                })()}
                {panel.title && (
                    <span className="text-sm font-medium text-muted-foreground truncate">
                        {panel.title}
                    </span>
                )}
            </div>
            <Kbd keys="Esc" size="md" onClick={() => onClose()} />
        </div>
    );
}

// ============================================================================
// Drawer Header — original panel header
// ============================================================================

function DrawerHeader({
    panel,
    stackDepth,
    onClose,
}: {
    panel: { icon?: any; title?: string; description?: string };
    stackDepth: number;
    onClose: () => void;
}) {
    return (
        <div className="flex-none flex items-center justify-between gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
                {stackDepth > 1 && (
                    <button
                        onClick={() => onClose()}
                        className="rounded-md p-1 hover:bg-muted transition-colors"
                        aria-label="Volver"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
                {panel.icon && (() => {
                    const IconComponent = panel.icon;
                    return <IconComponent className="h-5 w-5 text-primary flex-none" />;
                })()}
                <div className="min-w-0">
                    {panel.title && (
                        <h2 className="text-sm font-medium text-foreground truncate">
                            {panel.title}
                        </h2>
                    )}
                    {panel.description && (
                        <p className="text-xs text-muted-foreground truncate">
                            {panel.description}
                        </p>
                    )}
                </div>
            </div>
            <button
                onClick={() => onClose()}
                aria-label="Cerrar panel"
                className="rounded-md p-1.5 hover:bg-muted transition-colors flex-none"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

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
    return <Component {...(panel.props || {})} formId={panel.formId} />;
}

// ============================================================================
// Panel Footer — container-managed footer (works in both modes)
// ============================================================================

interface PanelFooterProps {
    config: PanelFooterConfig;
    formId: string;
    isSubmitting: boolean;
    onCancel: () => void;
    mode?: "panel" | "modal";
}

function PanelFooter({ config, formId, isSubmitting, onCancel, mode = "modal" }: PanelFooterProps) {
    const submitBtnRef = useRef<HTMLButtonElement>(null);
    const { createAnother, toggleCreateAnother } = usePanel();

    // Cmd+Enter or Enter shortcut to submit
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Enter (no modifier) when in modal mode, or Cmd+Enter always
            const isEnterSubmit = mode === "modal" && e.key === 'Enter' && !e.metaKey && !e.ctrlKey;
            const isCmdEnter = (e.metaKey || e.ctrlKey) && e.key === 'Enter';

            if ((isEnterSubmit || isCmdEnter) && !isSubmitting && submitBtnRef.current) {
                // Don't trigger if user is typing in a textarea
                const target = e.target as HTMLElement;
                if (target.tagName === 'TEXTAREA') return;

                e.preventDefault();
                submitBtnRef.current.click();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSubmitting, mode]);

    const footerPadding = mode === "modal" ? "px-5 py-3" : "p-3";
    const footerBorder = mode === "modal" ? "border-t border-border/20" : "border-t border-border";
    const footerBg = mode === "modal" ? "bg-transparent" : "bg-background";

    // Case 1: Custom footer override
    if (config.customFooter) {
        return (
            <div className={cn("flex-none", footerBg, footerPadding, footerBorder)}>
                {config.customFooter}
            </div>
        );
    }

    // Case 2: Multi-action buttons
    if (config.actions && config.actions.length > 0) {
        return (
            <div className={cn("flex-none", footerBg, footerPadding, footerBorder)}>
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

    // Case 3: Standard Cancel + Submit
    const cancelLabel = config.cancelLabel || "Cancelar";

    // Cancel-only mode
    if (!config.submitLabel) {
        return (
            <div className={cn("flex-none", footerBg, footerPadding, footerBorder)}>
                <div className="flex items-center justify-end">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        {cancelLabel}
                    </Button>
                </div>
            </div>
        );
    }

    // ─── Modal mode: flex with create-another toggle ─────
    if (mode === "modal") {
        return (
            <div className={cn("flex-none", footerBg, footerPadding, footerBorder)}>
                <div className="flex items-center justify-between">
                    {/* Left: Create Another toggle */}
                    <button
                        type="button"
                        onClick={toggleCreateAnother}
                        className={cn(
                            "flex items-center gap-2 text-xs select-none transition-colors",
                            createAnother ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className={cn(
                            "relative w-7 h-4 rounded-full transition-colors",
                            createAnother ? "bg-primary" : "bg-muted-foreground/30"
                        )}>
                            <div className={cn(
                                "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform",
                                createAnother ? "translate-x-3.5" : "translate-x-0.5"
                            )} />
                        </div>
                        <span>Crear otro</span>
                    </button>

                    {/* Right: Action buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="text-muted-foreground"
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            ref={submitBtnRef}
                            type="submit"
                            form={formId}
                            disabled={isSubmitting}
                            aria-busy={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {config.submitLabel}
                            <Kbd keys="Enter" className="ml-2" size="md" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Panel/drawer mode: grid layout (legacy) ─────────
    return (
        <div className={cn("flex-none", footerBg, footerPadding, footerBorder)}>
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

