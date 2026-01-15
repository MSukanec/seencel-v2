"use client"

import * as React from "react"
import { Column } from "@tanstack/react-table"
import { FacetedFilter } from "@/components/ui/faceted-filter"

interface DataTableFacetedFilterProps<TData, TValue> {
    column?: Column<TData, TValue>
    title?: string
    options: {
        label: string
        value: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
}

export function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
}: DataTableFacetedFilterProps<TData, TValue>) {
    const facets = column?.getFacetedUniqueValues()
    const selectedValues = new Set(column?.getFilterValue() as string[])

    const handleSelect = (value: string) => {
        const next = new Set(selectedValues)
        if (next.has(value)) {
            next.delete(value)
        } else {
            next.add(value)
        }
        const filterValues = Array.from(next)
        column?.setFilterValue(
            filterValues.length ? filterValues : undefined
        )
    }

    const handleClear = () => {
        column?.setFilterValue(undefined)
    }

    return (
        <FacetedFilter
            title={title}
            options={options}
            selectedValues={selectedValues}
            onSelect={handleSelect}
            onClear={handleClear}
            facets={facets}
        />
    )
}
