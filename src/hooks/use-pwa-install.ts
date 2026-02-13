"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UsePwaInstallReturn {
    /** Whether the native install prompt is available (Chrome/Edge/Samsung) */
    isInstallable: boolean;
    /** Whether the app is running as installed PWA (standalone mode) */
    isInstalled: boolean;
    /** Whether we're on iOS Safari (needs manual install instructions) */
    isIOS: boolean;
    /** Trigger the native install prompt */
    promptInstall: () => Promise<boolean>;
}

/**
 * Hook for managing PWA installation.
 * Captures the beforeinstallprompt event and provides install UX helpers.
 */
export function usePwaInstall(): UsePwaInstallReturn {
    const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Detect if running in standalone mode (installed)
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true; // Safari iOS
        setIsInstalled(isStandalone);

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Capture beforeinstallprompt event (Chrome, Edge, Samsung)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault(); // Prevent default mini-infobar
            setInstallPromptEvent(e as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        // Listen for successful installation
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setInstallPromptEvent(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!installPromptEvent) return false;

        try {
            await installPromptEvent.prompt();
            const { outcome } = await installPromptEvent.userChoice;

            if (outcome === "accepted") {
                setIsInstalled(true);
                setInstallPromptEvent(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error("[PWA Install] Error:", error);
            return false;
        }
    }, [installPromptEvent]);

    return {
        isInstallable: !!installPromptEvent,
        isInstalled,
        isIOS,
        promptInstall,
    };
}
