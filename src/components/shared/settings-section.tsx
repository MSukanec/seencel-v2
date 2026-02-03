"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface SettingsSectionProps {
    /** Icono de la sección (Lucide icon) */
    icon: LucideIcon;
    /** Título de la sección */
    title: string;
    /** Descripción de la sección */
    description?: string;
    /** Contenido de la sección (campos, tablas, etc.) - va en columna derecha */
    children: React.ReactNode;
    /** Clases adicionales para el contenedor */
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SettingsSection - Layout de dos columnas para configuraciones.
 * 
 * Layout:
 * ┌──────────────────────┬─────────────────────────────────────┐
 * │ [Icon] Título        │                                     │
 * │ Descripción          │        Children (contenido)         │
 * │                      │                                     │
 * └──────────────────────┴─────────────────────────────────────┘
 * 
 * @example
 * <SettingsSection
 *     icon={Package}
 *     title="Materiales"
 *     description="Materiales necesarios por unidad"
 * >
 *     <div className="space-y-4">
 *         <Button>Agregar</Button>
 *         <Table ... />
 *     </div>
 * </SettingsSection>
 */
export function SettingsSection({
    icon: Icon,
    title,
    description,
    children,
    className,
}: SettingsSectionProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b last:border-b-0",
                className
            )}
        >
            {/* Left Column - Label (1/3) */}
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-medium leading-none">
                        {title}
                    </h3>
                </div>
                {description && (
                    <p className="text-sm text-muted-foreground pl-6">
                        {description}
                    </p>
                )}
            </div>

            {/* Right Column - Content (2/3) */}
            <div className="md:col-span-2">
                {children}
            </div>
        </div>
    );
}

// ============================================================================
// Container Component
// ============================================================================

interface SettingsSectionContainerProps {
    /** Título principal del grupo */
    title?: string;
    /** Descripción del grupo */
    description?: string;
    /** Secciones hijas */
    children: React.ReactNode;
    /** Variante visual */
    variant?: "default" | "card";
    /** Clases adicionales */
    className?: string;
}

/**
 * SettingsSectionContainer - Contenedor para múltiples SettingsSection.
 * Opcionalmente puede tener borde de card.
 */
export function SettingsSectionContainer({
    title,
    description,
    children,
    variant = "default",
    className,
}: SettingsSectionContainerProps) {
    const isCard = variant === "card";

    return (
        <div
            className={cn(
                "w-full",
                isCard && "border rounded-lg bg-card p-6",
                className
            )}
        >
            {(title || description) && (
                <div className="mb-6 pb-4 border-b">
                    {title && (
                        <h2 className="text-lg font-semibold tracking-tight">
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {description}
                        </p>
                    )}
                </div>
            )}
            <div className="divide-y-0">
                {children}
            </div>
        </div>
    );
}
