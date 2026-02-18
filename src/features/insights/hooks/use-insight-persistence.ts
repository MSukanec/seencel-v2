import { useState, useEffect, useCallback } from "react";

/**
 * Hook para persistir qué insights fueron descartados.
 * Usa localStorage (la tabla user_insight_interactions fue eliminada de la DB).
 */
export function useInsightPersistence(moduleId: string) {
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    const storageKey = `seencel_dismissed_insights_${moduleId}`;

    // Load dismissed insights from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored) as string[];
                setDismissedIds(new Set(parsed));
            }
        } catch {
            // Fail silently
        } finally {
            setIsLoading(false);
        }
    }, [storageKey]);

    const dismissInsight = useCallback((insightId: string) => {
        setDismissedIds(prev => {
            const next = new Set(prev);
            next.add(insightId);
            // Persist to localStorage
            try {
                localStorage.setItem(storageKey, JSON.stringify([...next]));
            } catch {
                // Storage full or unavailable
            }
            return next;
        });
    }, [storageKey]);

    return {
        dismissedIds,
        dismissInsight,
        isLoading
    };
}
