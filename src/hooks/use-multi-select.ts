"use client";

import { useState, useCallback, useMemo, useRef } from "react";

// ============================================================================
// useMultiSelect Hook
// ============================================================================

interface UseMultiSelectOptions<T> {
    /** All items that can be selected */
    items: T[];
    /** Function to extract unique ID from each item */
    getItemId: (item: T) => string;
    /** Optional: callback when selection changes */
    onSelectionChange?: (selectedIds: Set<string>) => void;
}

interface UseMultiSelectReturn<T> {
    /** Set of selected item IDs */
    selectedIds: Set<string>;
    /** Number of selected items */
    selectedCount: number;
    /** Check if an item is selected */
    isSelected: (id: string) => boolean;
    /** Toggle selection of a single item */
    toggle: (id: string) => void;
    /** Select a single item (replacing current selection) */
    select: (id: string) => void;
    /** Select multiple items */
    selectMany: (ids: string[]) => void;
    /** Select all items */
    selectAll: () => void;
    /** Clear all selections */
    clearSelection: () => void;
    /** Get the selected items as array */
    getSelectedItems: () => T[];
    /** Whether any items are selected */
    hasSelection: boolean;
    /** Whether all items are selected */
    allSelected: boolean;
}

export function useMultiSelect<T>({
    items,
    getItemId,
    onSelectionChange,
}: UseMultiSelectOptions<T>): UseMultiSelectReturn<T> {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Keep a ref to the current selection so callbacks don't need it as a dependency.
    // This makes toggle/isSelected/etc referencially stable → memo'd children don't re-render.
    const selectedRef = useRef(selectedIds);
    selectedRef.current = selectedIds;

    const onSelectionChangeRef = useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;

    // Build a map for quick item lookup
    const itemMap = useMemo(() => {
        const map = new Map<string, T>();
        items.forEach(item => {
            map.set(getItemId(item), item);
        });
        return map;
    }, [items, getItemId]);

    // Keep items ref for selectAll
    const itemsRef = useRef(items);
    itemsRef.current = items;
    const getItemIdRef = useRef(getItemId);
    getItemIdRef.current = getItemId;

    // Helper to update selection and notify — stable via ref
    const updateSelection = useCallback((newSelection: Set<string>) => {
        setSelectedIds(newSelection);
        onSelectionChangeRef.current?.(newSelection);
    }, []);

    // All callbacks are stable (no deps on selectedIds) → memo'd children stay memoized
    const isSelected = useCallback((id: string) => {
        return selectedRef.current.has(id);
    }, []);

    const toggle = useCallback((id: string) => {
        const newSelection = new Set(selectedRef.current);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        updateSelection(newSelection);
    }, [updateSelection]);

    const select = useCallback((id: string) => {
        updateSelection(new Set([id]));
    }, [updateSelection]);

    const selectMany = useCallback((ids: string[]) => {
        const newSelection = new Set(selectedRef.current);
        ids.forEach(id => newSelection.add(id));
        updateSelection(newSelection);
    }, [updateSelection]);

    const selectAll = useCallback(() => {
        const allIds = itemsRef.current.map(getItemIdRef.current);
        updateSelection(new Set(allIds));
    }, [updateSelection]);

    const clearSelection = useCallback(() => {
        updateSelection(new Set());
    }, [updateSelection]);

    const getSelectedItems = useCallback(() => {
        return Array.from(selectedRef.current)
            .map(id => itemMap.get(id))
            .filter((item): item is T => item !== undefined);
    }, [itemMap]);

    const hasSelection = selectedIds.size > 0;
    const allSelected = items.length > 0 && selectedIds.size === items.length;
    const selectedCount = selectedIds.size;

    return {
        selectedIds,
        selectedCount,
        isSelected,
        toggle,
        select,
        selectMany,
        selectAll,
        clearSelection,
        getSelectedItems,
        hasSelection,
        allSelected,
    };
}
