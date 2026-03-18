"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export interface DateRangeFilterValue {
    from?: Date
    to?: Date
}

interface DateRangeFilterProps {
    title?: string
    value?: DateRangeFilterValue
    onChange: (value: DateRangeFilterValue | undefined) => void
    className?: string
}

/**
 * Generic Date Range Filter component
 * Can be used standalone or with DataTable columns
 */
export function DateRangeFilter({
    title = "Fechas",
    value,
    onChange,
    className,
}: DateRangeFilterProps) {
    const [open, setOpen] = React.useState(false)
    const hasValue = value?.from || value?.to

    const handleSelect = (range: DateRange | undefined) => {
        if (!range) {
            onChange(undefined)
            return
        }
        onChange({
            from: range.from,
            to: range.to
        })
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(undefined)
    }

    const handleApply = () => {
        setOpen(false)
    }

    const formatDateDisplay = () => {
        if (!value?.from) return null
        if (!value?.to) return format(value.from, "dd MMM", { locale: es })
        return `${format(value.from, "dd MMM", { locale: es })} - ${format(value.to, "dd MMM", { locale: es })}`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-9 border border-input border-dashed bg-background/50 text-muted-foreground shadow-none transition-all duration-200 hover:bg-background/80 hover:text-foreground data-[state=open]:bg-background data-[state=open]:text-foreground",
                        hasValue && "border-primary/50",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {title}
                    {hasValue && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1.5 font-normal bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
                                onClick={handleClear}
                            >
                                {formatDateDisplay()}
                                <X className="ml-1 h-3 w-3" />
                            </Badge>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 bg-popover/95 backdrop-blur-xl border-primary/20 shadow-xl"
                align="start"
            >
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={value?.from}
                    selected={{ from: value?.from, to: value?.to }}
                    onSelect={handleSelect}
                    numberOfMonths={2}
                    locale={es}
                    className="rounded-md"
                />
                <div className="border-t p-3">
                    <Button
                        size="sm"
                        className="w-full"
                        onClick={handleApply}
                    >
                        Aplicar
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

interface DataTableDateRangeFilterProps<TData, TValue> {
    column?: Column<TData, TValue>
    columnId: string
    title?: string
    className?: string
}

/**
 * Date Range Filter wired to a DataTable column
 * Filters rows based on date range (from - to)
 */
export function DataTableDateRangeFilter<TData, TValue>({
    column,
    columnId,
    title = "Fechas",
    className,
}: DataTableDateRangeFilterProps<TData, TValue>) {
    const filterValue = column?.getFilterValue() as DateRangeFilterValue | undefined

    return (
        <DateRangeFilter
            title={title}
            value={filterValue}
            onChange={(value) => column?.setFilterValue(value)}
            className={className}
        />
    )
}

/**
 * Custom filter function for date range filtering
 * Use this in your column definition:
 * 
 * {
 *   accessorKey: "payment_date",
 *   filterFn: dateRangeFilterFn,
 * }
 */
export function dateRangeFilterFn<TData>(
    row: { getValue: (id: string) => unknown },
    columnId: string,
    filterValue: DateRangeFilterValue | undefined
): boolean {
    if (!filterValue || (!filterValue.from && !filterValue.to)) {
        return true
    }

    const cellValue = row.getValue(columnId)
    if (!cellValue) return false

    const date = startOfDay(new Date(cellValue as string | number | Date))
    const from = filterValue.from ? startOfDay(filterValue.from) : null
    const to = filterValue.to ? endOfDay(filterValue.to) : null

    if (from && to) {
        return (isAfter(date, from) || isEqual(date, from)) &&
            (isBefore(date, to) || isEqual(date, to))
    }
    if (from) {
        return isAfter(date, from) || isEqual(date, from)
    }
    if (to) {
        return isBefore(date, to) || isEqual(date, to)
    }

    return true
}
