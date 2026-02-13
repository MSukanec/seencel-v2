"use client";

// ============================================================================
// SIDEBAR INSTALL BUTTON
// ============================================================================
// Shows a PWA install prompt in the sidebar when the app is not installed.
// Handles both native install prompt (Chrome/Edge) and iOS manual instructions.
// ============================================================================

import { Download, Share, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useState, useEffect } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarInstallButtonProps {
    isExpanded?: boolean;
}

export function SidebarInstallButton({ isExpanded = false }: SidebarInstallButtonProps) {
    const { isInstalled, isInstallable, isIOS, promptInstall } = usePwaInstall();
    const [dismissed, setDismissed] = useState(false);

    // Check localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            setDismissed(localStorage.getItem("pwa-install-dismissed") === "true");
        }
    }, []);

    // Don't show if already installed or dismissed
    if (isInstalled || dismissed) return null;

    // Don't show if not installable and not iOS
    if (!isInstallable && !isIOS) return null;

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem("pwa-install-dismissed", "true");
    };

    const handleInstall = async () => {
        if (isInstallable) {
            const accepted = await promptInstall();
            if (accepted) return; // Will auto-hide via isInstalled
        }
    };

    // Collapsed: just the icon with tooltip
    if (!isExpanded) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={isInstallable ? handleInstall : undefined}
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-lg",
                                "text-primary/80 hover:text-primary hover:bg-primary/10",
                                "transition-colors"
                            )}
                        >
                            <Download className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        Instalar Seencel
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // iOS: show manual instructions
    if (isIOS) {
        return (
            <div className="relative px-2 py-2 mx-1 rounded-lg bg-primary/5 border border-primary/10">
                <button
                    onClick={handleDismiss}
                    className="absolute top-1 right-1 p-0.5 rounded hover:bg-primary/10 text-muted-foreground"
                >
                    <X className="h-3 w-3" />
                </button>
                <div className="flex items-center gap-2 mb-1">
                    <Download className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[11px] font-medium">Instalá Seencel</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>Tocá</span>
                    <Share className="h-3 w-3 shrink-0" />
                    <span>→ &quot;Agregar a inicio&quot;</span>
                </div>
            </div>
        );
    }

    // Chrome/Edge: show install button
    return (
        <div className="relative mx-1">
            <button
                onClick={handleInstall}
                className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg",
                    "text-[11px] font-medium text-primary/80",
                    "bg-primary/5 hover:bg-primary/10 border border-primary/10",
                    "transition-colors"
                )}
            >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span>Instalar app</span>
            </button>
            <button
                onClick={handleDismiss}
                className="absolute top-1 right-1 p-0.5 rounded hover:bg-primary/10 text-muted-foreground"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
}
