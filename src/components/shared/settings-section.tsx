"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FeatureGuard } from "@/components/ui/feature-guard";

// ============================================================================
// Types
// ============================================================================

interface SettingsSectionAction {
    /** Label del botón */
    label: string;
    /** Ícono del botón (Lucide icon) */
    icon?: LucideIcon;
    /** Callback al hacer click (usar onClick O href, no ambos) */
    onClick?: () => void;
    /** Href para navegación en nueva pestaña (usar onClick O href, no ambos) */
    href?: string;
    /** Variante: primary (default) o secondary */
    variant?: "primary" | "secondary";
    /** Feature guard para bloquear según plan */
    featureGuard?: {
        isEnabled: boolean;
        featureName: string;
        requiredPlan?: string;
        customMessage?: string;
    };
}

interface SettingsSectionProps {
    /** Icono de la sección (Lucide icon) */
    icon: LucideIcon;
    /** Título de la sección */
    title: string;
    /** Descripción de la sección */
    description?: React.ReactNode;
    /** Botones de acción debajo de la descripción */
    actions?: SettingsSectionAction[];
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
 * │ [Btn1] [Btn2]        │                                     │
 * └──────────────────────┴─────────────────────────────────────┘
 * 
 * @example
 * <SettingsSection
 *     icon={Package}
 *     title="Materiales"
 *     description="Materiales necesarios por unidad"
 *     actions={[
 *         { label: "Agregar", icon: Plus, onClick: handleAdd },
 *         { label: "Importar", icon: Upload, onClick: handleImport, variant: "secondary" },
 *     ]}
 * >
 *     <Table ... />
 * </SettingsSection>
 */
export function SettingsSection({
    icon: Icon,
    title,
    description,
    actions,
    children,
    className,
}: SettingsSectionProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-4 py-8 border-b last:border-b-0",
                className
            )}
        >
            {/* Left Column - Label (1/3) */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-medium leading-none">
                            {title}
                        </h3>
                    </div>
                    {description && (
                        <div className="text-sm text-muted-foreground pl-6 leading-relaxed flex flex-col items-start gap-1">
                            {description}
                        </div>
                    )}
                </div>
                {actions && actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pl-6">
                        {actions.map((action) => {
                            const ActionIcon = action.icon;
                            const button = (
                                <Button
                                    key={action.label}
                                    variant={action.variant === "secondary" ? "outline" : "default"}
                                    size="sm"
                                    onClick={action.href
                                        ? () => window.open(action.href, "_blank")
                                        : action.onClick
                                    }
                                    className="h-8 text-xs"
                                >
                                    {ActionIcon && <ActionIcon className="h-3.5 w-3.5 mr-1.5" />}
                                    {action.label}
                                </Button>
                            );

                            if (action.featureGuard) {
                                return (
                                    <FeatureGuard
                                        key={action.label}
                                        isEnabled={action.featureGuard.isEnabled}
                                        featureName={action.featureGuard.featureName}
                                        requiredPlan={action.featureGuard.requiredPlan}
                                        customMessage={action.featureGuard.customMessage}
                                    >
                                        {button}
                                    </FeatureGuard>
                                );
                            }

                            return button;
                        })}
                    </div>
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
