/**
 * FormTextField — Unified borderless text input for panel forms
 *
 * Three visual variants, from highest to lowest importance:
 * - variant="hero"    → Large text (2xl/4xl), dark accented bg, for primary values (name, amount)
 * - variant="body"    → Medium text (sm), plain textarea, for descriptions/notes
 * - variant="caption" → Small text (xs), subtle separator, for references/codes
 *
 * Usage:
 *   <FormTextField variant="hero" value={name} onChange={setName} placeholder="Nombre..." />
 *   <FormTextField variant="hero" value={amount} onChange={setAmount} prefix="$" size="lg" />
 *   <FormTextField variant="body" value={notes} onChange={setNotes} rows={3} />
 *   <FormTextField variant="caption" value={ref} onChange={setRef} prefix="#" />
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type FormTextFieldVariant = "hero" | "body" | "caption";

export interface FormTextFieldProps {
    /** Visual variant: hero (primary), body (description), caption (reference) */
    variant?: FormTextFieldVariant;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    /** Prefix displayed before the input (e.g. "$", "#", or an icon) */
    prefix?: React.ReactNode;
    /** Input mode: "text" for names, "decimal" for amounts (hero only) */
    inputMode?: "text" | "decimal";
    /** Size sub-variant for hero: "default" = text-2xl, "lg" = text-4xl */
    size?: "default" | "lg";
    /** Number of rows for body variant (textarea) */
    rows?: number;
    /** Extra content rendered inline (e.g. exchange rate badge) — hero only */
    children?: React.ReactNode;
    className?: string;
}

export function FormTextField({
    variant = "body",
    value,
    onChange,
    placeholder,
    autoFocus = false,
    prefix,
    inputMode = "text",
    size = "default",
    rows = 3,
    children,
    className,
}: FormTextFieldProps) {
    // ── Hero variant ────────────────────────────────────────────────────
    if (variant === "hero") {
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

    // ── Caption variant ─────────────────────────────────────────────────
    if (variant === "caption") {
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
                        placeholder={placeholder ?? "# Nro. de recibo o referencia"}
                        autoFocus={autoFocus}
                        className="w-full bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/30 outline-none border-none"
                    />
                </div>
            </div>
        );
    }

    // ── Body variant (default) ──────────────────────────────────────────
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? "Agregar notas o descripción..."}
            rows={rows}
            autoFocus={autoFocus}
            className={cn(
                "w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border-none resize-none leading-relaxed",
                className
            )}
        />
    );
}
