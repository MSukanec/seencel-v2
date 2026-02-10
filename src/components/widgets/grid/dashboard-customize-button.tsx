"use client";

import { Button } from "@/components/ui/button";
import { LayoutDashboard, Check } from "lucide-react";
import { useDashboardEditStore } from "@/stores/dashboard-edit-store";
import { FeatureGuard } from "@/components/ui/feature-guard";
import { useSearchParams } from "next/navigation";

// ============================================================================
// DASHBOARD CUSTOMIZE BUTTON
// ============================================================================
// Botón que vive en el header del PageWrapper para activar/desactivar
// el modo de personalización del dashboard de widgets.
// Solo se muestra en la tab "overview" (Visión General).
// Envuelto con FeatureGuard para respetar restricciones del plan.
// ============================================================================

interface DashboardCustomizeButtonProps {
    /** Whether customization is enabled by the current plan */
    isEnabled?: boolean;
}

export function DashboardCustomizeButton({ isEnabled = true }: DashboardCustomizeButtonProps) {
    const { isEditing, toggle } = useDashboardEditStore();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("view") || "overview";

    // Only show on overview tab (widget dashboard)
    if (activeTab !== "overview") return null;

    const button = (
        <Button
            variant={isEditing ? "default" : "outline"}
            size="icon"
            onClick={toggle}
            className="h-8 w-8 cursor-pointer"
        >
            {isEditing ? (
                <Check className="h-4 w-4" />
            ) : (
                <LayoutDashboard className="h-4 w-4" />
            )}
            <span className="sr-only">{isEditing ? "Guardar" : "Personalizar"}</span>
        </Button>
    );

    return (
        <FeatureGuard
            isEnabled={isEnabled}
            featureName="Personalizar Dashboard"
            requiredPlan="PRO"
        >
            {button}
        </FeatureGuard>
    );
}

