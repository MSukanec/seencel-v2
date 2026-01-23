"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Format date to YYYY-MM-DD using LOCAL timezone (not UTC)
 * This prevents the "off by one day" issue when sending to backend
 */
function formatDateLocal(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

interface DatePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    /** If true, shows a clear button when date is selected */
    clearable?: boolean
    /** Format string for date display */
    displayFormat?: string
    /** Disable dates before this date */
    minDate?: Date
    /** Disable dates after this date */
    maxDate?: Date
    /** If true, uses a native input on mobile */
    id?: string
    name?: string
    required?: boolean
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Seleccionar fecha",
    disabled = false,
    className,
    clearable = true,
    displayFormat = "PPP",
    minDate,
    maxDate,
    id,
    name,
    required = false,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [month, setMonth] = React.useState<Date>(value || new Date())

    const handleSelect = (date: Date | undefined) => {
        onChange?.(date)
        if (date) {
            setOpen(false)
        }
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.(undefined)
    }

    const goToPreviousMonth = () => {
        setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }

    const goToToday = () => {
        const today = new Date()
        setMonth(today)
        onChange?.(today)
        setOpen(false)
    }

    return (
        <>
            {/* Hidden input for form submission - uses LOCAL date to avoid UTC issues */}
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={value ? formatDateLocal(value) : ""}
                />
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-left font-normal group relative overflow-hidden",
                            "bg-background/50 backdrop-blur-sm",
                            "border-border/50 hover:border-primary/50",
                            "transition-all duration-300 ease-out",
                            "hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)]",
                            "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
                            !value && "text-muted-foreground",
                            className
                        )}
                    >
                        {/* Animated gradient border on hover */}
                        <span className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <CalendarIcon className={cn(
                            "mr-2 h-4 w-4 shrink-0 transition-all duration-300",
                            "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                        )} />

                        <span className="flex-1 truncate relative z-10">
                            {value ? (
                                <span className="text-foreground font-medium">
                                    {format(value, displayFormat, { locale: es })}
                                </span>
                            ) : (
                                <span>{placeholder}</span>
                            )}
                        </span>

                        {/* Clear button */}
                        {clearable && value && !disabled && (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={handleClear}
                                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
                                className={cn(
                                    "ml-2 p-0.5 rounded-full relative z-10",
                                    "text-muted-foreground hover:text-foreground",
                                    "hover:bg-destructive/10 hover:text-destructive",
                                    "transition-all duration-200",
                                    "opacity-0 group-hover:opacity-100"
                                )}
                            >
                                <X className="h-3.5 w-3.5" />
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    className={cn(
                        "w-auto p-0 overflow-hidden",
                        "bg-popover/95 backdrop-blur-xl",
                        "border-primary/20 shadow-2xl shadow-primary/5",
                        "animate-in fade-in-0 zoom-in-95 duration-200"
                    )}
                    align="start"
                    sideOffset={8}
                >
                    {/* Premium Header */}
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 border-b border-border/50">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full",
                                    "hover:bg-primary/10 hover:text-primary",
                                    "transition-all duration-200"
                                )}
                                onClick={goToPreviousMonth}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex flex-col items-center">
                                <span className="text-sm font-semibold text-foreground capitalize">
                                    {format(month, "MMMM yyyy", { locale: es })}
                                </span>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full",
                                    "hover:bg-primary/10 hover:text-primary",
                                    "transition-all duration-200"
                                )}
                                onClick={goToNextMonth}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Calendar Body */}
                    <div className="p-3">
                        <DayPicker
                            mode="single"
                            selected={value}
                            onSelect={handleSelect}
                            month={month}
                            onMonthChange={setMonth}
                            locale={es}
                            disabled={(date) => {
                                if (minDate && date < minDate) return true
                                if (maxDate && date > maxDate) return true
                                return false
                            }}
                            showOutsideDays
                            classNames={{
                                root: "w-full",
                                months: "flex flex-col",
                                month: "space-y-2",
                                month_caption: "hidden",
                                nav: "hidden",
                                table: "w-full border-collapse",
                                weekdays: "flex mb-1",
                                weekday: cn(
                                    "text-muted-foreground w-9 font-medium text-xs uppercase tracking-wide",
                                    "flex items-center justify-center"
                                ),
                                week: "flex w-full",
                                day: cn(
                                    "relative p-0 text-center focus-within:relative focus-within:z-20",
                                    "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                                ),
                                day_button: cn(
                                    "h-9 w-9 rounded-lg font-normal text-sm",
                                    "flex items-center justify-center",
                                    "transition-all duration-200 ease-out",
                                    "hover:bg-primary/10 hover:text-primary hover:scale-110",
                                    "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none",
                                    "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:font-semibold",
                                    "aria-selected:shadow-lg aria-selected:shadow-primary/25",
                                    "aria-selected:hover:bg-primary aria-selected:hover:scale-105"
                                ),
                                today: cn(
                                    "bg-primary/20 text-primary font-semibold rounded-lg",
                                    "aria-selected:bg-primary aria-selected:text-primary-foreground"
                                ),
                                outside: "text-muted-foreground/40 aria-selected:bg-primary/50",
                                disabled: "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent hover:scale-100",
                                hidden: "invisible",
                                range_start: "rounded-l-lg",
                                range_end: "rounded-r-lg",
                                range_middle: "rounded-none bg-primary/10",
                            }}
                            components={{
                            }}
                        />
                    </div>

                    {/* Premium Footer */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "text-xs text-muted-foreground",
                                "hover:text-primary hover:bg-primary/10",
                                "transition-all duration-200"
                            )}
                            onClick={() => {
                                onChange?.(undefined)
                                setOpen(false)
                            }}
                        >
                            Limpiar
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "text-xs font-medium",
                                "text-primary hover:bg-primary hover:text-primary-foreground",
                                "transition-all duration-200"
                            )}
                            onClick={goToToday}
                        >
                            Hoy
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </>
    )
}


