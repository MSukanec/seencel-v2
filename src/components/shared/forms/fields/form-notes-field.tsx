/**
 * FormNotesField — Textarea borderless para notas/descripción
 *
 * Renderiza un textarea sin bordes, integrado al flow del form.
 * Usado para descripción, notas, comentarios, etc.
 *
 * Usage:
 *   <FormNotesField value={notes} onChange={setNotes} />
 */

"use client";

import { cn } from "@/lib/utils";

export interface FormNotesFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
}

export function FormNotesField({
    value,
    onChange,
    placeholder = "Agregar notas o descripción...",
    rows = 3,
    className,
}: FormNotesFieldProps) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={cn(
                "w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border-none resize-none leading-relaxed",
                className
            )}
        />
    );
}
