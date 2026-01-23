"use client";

import { useOptimistic, useTransition, useCallback } from "react";
import { toast } from "sonner";

/**
 * useOptimisticAction - Hook for optimistic UI updates
 * 
 * Provides instant visual feedback while the server action runs in the background.
 * Automatically handles rollback on error.
 * 
 * @example
 * ```tsx
 * const { optimisticData, execute, isPending } = useOptimisticAction({
 *   data: payments,
 *   action: deletePaymentAction,
 *   updateFn: (current, deletedId) => current.filter(p => p.id !== deletedId),
 *   onSuccess: () => toast.success("Eliminado"),
 *   onError: () => toast.error("Error al eliminar"),
 * });
 * ```
 */

interface UseOptimisticActionOptions<TData, TInput, TResult> {
    /** Current data state */
    data: TData;
    /** Server action to execute */
    action: (input: TInput) => Promise<TResult>;
    /** Function to optimistically update the data */
    updateFn: (currentData: TData, input: TInput) => TData;
    /** Callback on successful action */
    onSuccess?: (result: TResult, input: TInput) => void;
    /** Callback on error - receives error and input for context */
    onError?: (error: Error, input: TInput) => void;
    /** Success toast message (optional) */
    successMessage?: string;
    /** Error toast message (optional) */
    errorMessage?: string;
}

interface UseOptimisticActionReturn<TData, TInput> {
    /** Optimistically updated data - use this for rendering */
    optimisticData: TData;
    /** Execute the action with optimistic update */
    execute: (input: TInput) => Promise<void>;
    /** Whether the action is currently pending */
    isPending: boolean;
}

export function useOptimisticAction<TData, TInput, TResult = void>({
    data,
    action,
    updateFn,
    onSuccess,
    onError,
    successMessage,
    errorMessage,
}: UseOptimisticActionOptions<TData, TInput, TResult>): UseOptimisticActionReturn<TData, TInput> {
    const [isPending, startTransition] = useTransition();

    // useOptimistic from React 19
    const [optimisticData, setOptimisticData] = useOptimistic<TData, TInput>(
        data,
        (currentData, input) => updateFn(currentData, input)
    );

    const execute = useCallback(
        async (input: TInput) => {
            // Apply optimistic update immediately
            startTransition(async () => {
                setOptimisticData(input);

                try {
                    const result = await action(input);

                    // Success handling
                    if (successMessage) {
                        toast.success(successMessage);
                    }
                    onSuccess?.(result, input);
                } catch (error) {
                    // Error handling - React will automatically revert the optimistic update
                    const err = error instanceof Error ? error : new Error(String(error));

                    if (errorMessage) {
                        toast.error(errorMessage);
                    }
                    onError?.(err, input);
                }
            });
        },
        [action, updateFn, onSuccess, onError, successMessage, errorMessage, setOptimisticData]
    );

    return {
        optimisticData,
        execute,
        isPending,
    };
}

/**
 * useOptimisticList - Specialized hook for list operations (add, update, delete)
 * 
 * @example
 * ```tsx
 * const { optimisticItems, addItem, removeItem, updateItem, isPending } = useOptimisticList({
 *   items: payments,
 *   getItemId: (p) => p.id,
 * });
 * ```
 */

interface UseOptimisticListOptions<TItem> {
    items: TItem[];
    getItemId: (item: TItem) => string | number;
}

type OptimisticListAction<TItem> =
    | { type: 'add'; item: TItem }
    | { type: 'remove'; id: string | number }
    | { type: 'update'; id: string | number; updates: Partial<TItem> };

export function useOptimisticList<TItem>({
    items,
    getItemId,
}: UseOptimisticListOptions<TItem>) {
    const [isPending, startTransition] = useTransition();

    const [optimisticItems, setOptimisticItems] = useOptimistic<TItem[], OptimisticListAction<TItem>>(
        items,
        (currentItems, action) => {
            switch (action.type) {
                case 'add':
                    return [...currentItems, action.item];
                case 'remove':
                    return currentItems.filter(item => getItemId(item) !== action.id);
                case 'update':
                    return currentItems.map(item =>
                        getItemId(item) === action.id
                            ? { ...item, ...action.updates }
                            : item
                    );
                default:
                    return currentItems;
            }
        }
    );

    const addItem = useCallback(
        (item: TItem, serverAction?: () => Promise<void>) => {
            startTransition(async () => {
                setOptimisticItems({ type: 'add', item });
                if (serverAction) {
                    await serverAction();
                }
            });
        },
        [setOptimisticItems]
    );

    const removeItem = useCallback(
        (id: string | number, serverAction?: () => Promise<void>) => {
            startTransition(async () => {
                setOptimisticItems({ type: 'remove', id });
                if (serverAction) {
                    await serverAction();
                }
            });
        },
        [setOptimisticItems]
    );

    const updateItem = useCallback(
        (id: string | number, updates: Partial<TItem>, serverAction?: () => Promise<void>) => {
            startTransition(async () => {
                setOptimisticItems({ type: 'update', id, updates });
                if (serverAction) {
                    await serverAction();
                }
            });
        },
        [setOptimisticItems]
    );

    return {
        optimisticItems,
        addItem,
        removeItem,
        updateItem,
        isPending,
    };
}

