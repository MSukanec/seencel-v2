"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

interface ContentLayoutProps {
    /** Layout variant */
    variant: 'wide' | 'full' | 'narrow'
    /** Content */
    children: React.ReactNode
    /** Additional className */
    className?: string
}

/**
 * ContentLayout - Container for page content
 * 
 * ARQUITECTURA SIMPLIFICADA:
 * - Solo 1 div contenedor (no 2 anidados)
 * - Children pueden usar h-full o flex-1 directamente
 * - El scroll es del contenedor, no de un wrapper
 * 
 * Variantes:
 * - wide: padding lateral 6/8, para tablas y listas
 * - narrow: max-width 5xl (1024px), centrado, sin padding lateral
 * - full: sin padding, para canvas/mapas
 */
export function ContentLayout({
    variant,
    children,
    className
}: ContentLayoutProps) {
    // Base classes que comparten todas las variantes
    // flex-1: funciona en contenedores flex (TabsContent con flex-1)
    // h-full: funciona en contenedores con altura explícita
    const baseClasses = "h-full w-full flex-1 flex flex-col overflow-y-auto";

    // Padding vertical igual para todas (excepto full)
    const paddingY = "py-6 pb-20";

    switch (variant) {
        case 'wide':
            // Padding lateral, scroll, height 100%
            return (
                <div className={cn(baseClasses, paddingY, "px-2 md:px-8", className)}>
                    {children}
                </div>
            );

        case 'narrow':
            // Centrado con max-width 5xl (1024px), sin padding lateral
            return (
                <div className={cn(baseClasses, className)}>
                    <div className={cn("mx-auto max-w-5xl w-full", paddingY)}>
                        {children}
                    </div>
                </div>
            );

        case 'full':
            // Sin padding, para canvas/mapas
            return (
                <div className={cn(baseClasses, "overflow-hidden", className)}>
                    {children}
                </div>
            );

        default:
            return (
                <div className={cn(baseClasses, paddingY, "px-2 md:px-8", className)}>
                    {children}
                </div>
            );
    }
}


