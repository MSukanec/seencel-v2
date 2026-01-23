'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * 🚀 useSmartRefresh - Hybrid refresh pattern
 * 
 * Replaces router.refresh() with smart cache invalidation:
 * - If React Query is managing the data → invalidate specific queries
 * - If Server Components own the data → fall back to router.refresh()
 * 
 * This allows GRADUAL migration from Server Components to React Query.
 * 
 * @example
 * const { refresh, invalidate, invalidateAndRefresh } = useSmartRefresh();
 * 
 * // After mutation, choose strategy:
 * refresh();           // Like router.refresh() but smarter
 * invalidate(['payments', projectId]); // Invalidate specific cache
 * invalidateAndRefresh(['clients']); // Invalidate + router refresh
 */
export function useSmartRefresh() {
    const router = useRouter();
    const queryClient = useQueryClient();

    /**
     * Full page refresh - use sparingly
     * For data still managed by Server Components
     */
    const refresh = useCallback(() => {
        router.refresh();
    }, [router]);

    /**
     * Invalidate specific React Query cache
     * Data will refetch on next access
     */
    const invalidate = useCallback((queryKey: readonly unknown[]) => {
        queryClient.invalidateQueries({ queryKey });
    }, [queryClient]);

    /**
     * Invalidate all queries matching a prefix
     * e.g., invalidatePrefix('clients') invalidates ['clients', ...] keys
     */
    const invalidatePrefix = useCallback((prefix: string) => {
        queryClient.invalidateQueries({
            predicate: (query) =>
                Array.isArray(query.queryKey) &&
                query.queryKey[0] === prefix
        });
    }, [queryClient]);

    /**
     * Hybrid: Invalidate query cache AND refresh Server Components
     * Use when data is in both client cache and server state
     */
    const invalidateAndRefresh = useCallback((queryKey?: readonly unknown[]) => {
        if (queryKey) {
            queryClient.invalidateQueries({ queryKey });
        }
        router.refresh();
    }, [queryClient, router]);

    /**
     * Clear all caches and refresh
     * Nuclear option - use for full state reset
     */
    const clearAndRefresh = useCallback(() => {
        queryClient.clear();
        router.refresh();
    }, [queryClient, router]);

    return {
        refresh,
        invalidate,
        invalidatePrefix,
        invalidateAndRefresh,
        clearAndRefresh,
    };
}

