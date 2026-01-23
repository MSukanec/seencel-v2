'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * 🚀 React Query Keys
 * Standardized key patterns for consistent cache management
 */
export const queryKeys = {
    // Clients
    clients: (projectId: string) => ['clients', projectId] as const,
    clientPayments: (clientId: string) => ['client-payments', clientId] as const,
    clientCommitments: (clientId: string) => ['client-commitments', clientId] as const,

    // Projects  
    projects: (orgId: string) => ['projects', orgId] as const,
    project: (projectId: string) => ['project', projectId] as const,

    // Contacts
    contacts: (orgId: string) => ['contacts', orgId] as const,

    // Kanban
    kanbanBoard: (boardId: string) => ['kanban-board', boardId] as const,
    kanbanCards: (boardId: string) => ['kanban-cards', boardId] as const,

    // Finance
    financeOverview: (projectId: string) => ['finance-overview', projectId] as const,
    wallets: (orgId: string) => ['wallets', orgId] as const,
    currencies: (orgId: string) => ['currencies', orgId] as const,

    // Academy
    courses: () => ['courses'] as const,
    enrollments: () => ['enrollments'] as const,
    instructors: () => ['instructors'] as const,

    // Notifications
    notifications: (userId: string) => ['notifications', userId] as const,
} as const;

/**
 * 🚀 Invalidation helpers
 * Use these after mutations to refresh relevant queries
 */
export function useInvalidateQuery() {
    const queryClient = useQueryClient();

    return {
        // Invalidate specific query
        invalidate: (queryKey: readonly unknown[]) => {
            queryClient.invalidateQueries({ queryKey });
        },

        // Invalidate all queries starting with prefix
        invalidatePrefix: (prefix: string) => {
            queryClient.invalidateQueries({
                predicate: (query) =>
                    Array.isArray(query.queryKey) &&
                    query.queryKey[0] === prefix
            });
        },

        // Invalidate multiple queries at once
        invalidateAll: (queryKeys: readonly unknown[][]) => {
            queryKeys.forEach(key => {
                queryClient.invalidateQueries({ queryKey: key });
            });
        },

        // Remove stale data from cache entirely
        removeQueries: (queryKey: readonly unknown[]) => {
            queryClient.removeQueries({ queryKey });
        },
    };
}

/**
 * 🚀 Optimistic update helpers (for mutations)
 * These work WITH React Query's built-in optimistic updates
 */
export function useOptimisticMutation<TData, TVariables, TContext = unknown>({
    mutationFn,
    queryKey,
    optimisticUpdate,
    onSuccess,
    onError,
}: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    queryKey: readonly unknown[];
    optimisticUpdate?: (oldData: TData | undefined, variables: TVariables) => TData;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onMutate: async (variables) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey });

            // Snapshot current data
            const previousData = queryClient.getQueryData<TData>(queryKey);

            // Optimistically update if handler provided
            if (optimisticUpdate && previousData !== undefined) {
                queryClient.setQueryData<TData>(
                    queryKey,
                    (old) => optimisticUpdate(old, variables)
                );
            }

            return { previousData } as TContext;
        },
        onError: (error, variables, context) => {
            // Rollback on error
            if ((context as { previousData?: TData })?.previousData !== undefined) {
                queryClient.setQueryData(queryKey, (context as { previousData: TData }).previousData);
            }
            onError?.(error as Error, variables, context);
        },
        onSuccess: (data, variables) => {
            // Always refetch to ensure server state
            queryClient.invalidateQueries({ queryKey });
            onSuccess?.(data, variables);
        },
    });
}

