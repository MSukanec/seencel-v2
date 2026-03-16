/**
 * FormReferenceField — Input pequeño con separador para referencia/nro
 *
 * Renderiza un input subtle con borde superior de separación.
 * Usado para números de referencia, recibos, códigos, etc.
 *
 * Usage:
 *   <FormReferenceField value={reference} onChange={setReference} />
 *   <FormReferenceField value={ref} onChange={setRef} prefix="#" />
 *   <FormReferenceField value={ref} onChange={setRef} prefix={<Icon />} />
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormReferenceFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /** Prefix displayed before the input (e.g. "#" or an icon) */
    prefix?: React.ReactNode;
    className?: string;
}

export function FormReferenceField({
    value,
    onChange,
    placeholder = "# Nro. de recibo o referencia",
    prefix,
    className,
}: FormReferenceFieldProps) {
    return (
        <div className={cn("border-t border-border/10 pt-2 mt-1", className)}>
            <div className="flex items-center gap-1">
                {prefix && (
                    <span className="text-xs text-muted-foreground/50 select-none shrink-0">{prefix}</span>
                )}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/30 outline-none border-none"
                />
            </div>
        </div>
    );
}

