"use client";

import { useState, useMemo, useCallback } from "react";
import { DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";

// ─── Types ───────────────────────────────────────────────

/** A faceted filter definition */
export interface FacetedFilterConfig {
    /** Unique key for this filter */
    key: string;
    /** Display label (e.g. "Tipo", "Estado") */
    title: string;
    /** Icon component for the filter category */
    icon?: React.ComponentType<{ className?: string }>;
    /** Available options */
    options: { label: string; value: string }[];
}

interface UseTableFiltersOptions {
    /** Enable date range filtering (default: false) */
    enableDateRange?: boolean;
    /** Faceted filter configurations */
    facets?: FacetedFilterConfig[];
}

export interface UseTableFiltersReturn {
    /** Search query state */
    searchQuery: string;
    /** Set search query */
    setSearchQuery: (query: string) => void;
    /** Date range state */
    dateRange: DateRangeFilterValue | undefined;
    /** Set date range */
    setDateRange: (range: DateRangeFilterValue | undefined) => void;
    /** Map of faceted filter states (key -> Set<string>) */
    facetValues: Record<string, Set<string>>;
    /** Toggle a value in a faceted filter */
    toggleFacet: (key: string, value: string) => void;
    /** Clear a specific faceted filter */
    clearFacet: (key: string) => void;
    /** Clear ALL filters (search + date + facets) */
    clearAll: () => void;
    /** Whether any filter is active */
    hasActiveFilters: boolean;
    /** Original facet configs (for FilterPopover consumption) */
    facetConfigs: FacetedFilterConfig[];
    /** Whether date range is enabled */
    enableDateRange: boolean;
}

// ─── Hook ────────────────────────────────────────────────

export function useTableFilters(
    options: UseTableFiltersOptions = {}
): UseTableFiltersReturn {
    const { facets = [], enableDateRange = false } = options;

    // ─── State ───────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    // Faceted filter state: { "type": Set(["a","b"]), "status": Set(["x"]) }
    const [facetValues, setFacetValues] = useState<Record<string, Set<string>>>(() => {
        const initial: Record<string, Set<string>> = {};
        for (const f of facets) {
            initial[f.key] = new Set();
        }
        return initial;
    });

    // ─── Actions ─────────────────────────────────────────
    const toggleFacet = useCallback((key: string, value: string) => {
        setFacetValues(prev => {
            const next = { ...prev };
            const set = new Set(prev[key] || []);
            set.has(value) ? set.delete(value) : set.add(value);
            next[key] = set;
            return next;
        });
    }, []);

    const clearFacet = useCallback((key: string) => {
        setFacetValues(prev => ({
            ...prev,
            [key]: new Set(),
        }));
    }, []);

    const clearAll = useCallback(() => {
        setSearchQuery("");
        setDateRange(undefined);
        setFacetValues(prev => {
            const cleared: Record<string, Set<string>> = {};
            for (const key of Object.keys(prev)) {
                cleared[key] = new Set();
            }
            return cleared;
        });
    }, []);

    // ─── Derived ─────────────────────────────────────────
    const hasActiveFilters = useMemo(() => {
        if (searchQuery) return true;
        if (dateRange?.from || dateRange?.to) return true;
        for (const set of Object.values(facetValues)) {
            if (set.size > 0) return true;
        }
        return false;
    }, [searchQuery, dateRange, facetValues]);

    return {
        searchQuery,
        setSearchQuery,
        dateRange,
        setDateRange,
        facetValues,
        toggleFacet,
        clearFacet,
        clearAll,
        hasActiveFilters,
        facetConfigs: facets,
        enableDateRange,
    };
}
