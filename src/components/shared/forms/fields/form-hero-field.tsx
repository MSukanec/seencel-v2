/**
 * FormHeroField — Campo principal prominente del form
 *
 * Renderiza un input grande con fondo oscuro acentuado.
 * Es el campo más importante del form (nombre, monto, título).
 *
 * Variantes:
 * - size="default" → text-2xl (para nombres, títulos)
 * - size="lg" → text-4xl (para montos)
 *
 * Usage:
 *   <FormHeroField value={name} onChange={setName} placeholder="Nombre..." />
 *   <FormHeroField value={amount} onChange={setAmount} prefix="$" size="lg" />
 */

"use client";

import { cn } from "@/lib/utils";

export interface FormHeroFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    /** Prefix displayed before the input (e.g. currency symbol "$") */
    prefix?: React.ReactNode;
    /** Input mode: "text" for names, "decimal" for amounts */
    inputMode?: "text" | "decimal";
    /** Size variant: "default" = text-2xl, "lg" = text-4xl */
    size?: "default" | "lg";
    /** Extra content rendered inline (e.g. exchange rate) */
    children?: React.ReactNode;
    className?: string;
}

export function FormHeroField({
    value,
    onChange,
    placeholder,
    autoFocus = false,
    prefix,
    inputMode = "text",
    size = "default",
    children,
    className,
}: FormHeroFieldProps) {
    return (
        <div
            className={cn("-mx-5 px-5 py-4 border-y border-border/20", className)}
            style={{ background: "color-mix(in oklch, var(--sidebar), black 15%)" }}
        >
            <div className="flex items-center gap-3">
                {prefix && (
                    <span className={cn(
                        "font-light text-muted-foreground select-none",
                        size === "lg" ? "text-2xl" : "text-lg"
                    )}>
                        {prefix}
                    </span>
                )}
                <input
                    type="text"
                    inputMode={inputMode}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className={cn(
                        "flex-1 bg-transparent font-semibold text-foreground placeholder:text-muted-foreground/40 outline-none border-none",
                        size === "lg" ? "text-4xl" : "text-2xl"
                    )}
                />
                {children}
            </div>
        </div>
    );
}
