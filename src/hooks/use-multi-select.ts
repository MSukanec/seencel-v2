"use client";

import { useState, useCallback, useMemo } from "react";

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

    // Build a map for quick item lookup
    const itemMap = useMemo(() => {
        const map = new Map<string, T>();
        items.forEach(item => {
            map.set(getItemId(item), item);
        });
        return map;
    }, [items, getItemId]);

    // Helper to update selection and notify
    const updateSelection = useCallback((newSelection: Set<string>) => {
        setSelectedIds(newSelection);
        onSelectionChange?.(newSelection);
    }, [onSelectionChange]);

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    const toggle = useCallback((id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        updateSelection(newSelection);
    }, [selectedIds, updateSelection]);

    const select = useCallback((id: string) => {
        updateSelection(new Set([id]));
    }, [updateSelection]);

    const selectMany = useCallback((ids: string[]) => {
        const newSelection = new Set(selectedIds);
        ids.forEach(id => newSelection.add(id));
        updateSelection(newSelection);
    }, [selectedIds, updateSelection]);

    const selectAll = useCallback(() => {
        const allIds = items.map(getItemId);
        updateSelection(new Set(allIds));
    }, [items, getItemId, updateSelection]);

    const clearSelection = useCallback(() => {
        updateSelection(new Set());
    }, [updateSelection]);

    const getSelectedItems = useCallback(() => {
        return Array.from(selectedIds)
            .map(id => itemMap.get(id))
            .filter((item): item is T => item !== undefined);
    }, [selectedIds, itemMap]);

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
