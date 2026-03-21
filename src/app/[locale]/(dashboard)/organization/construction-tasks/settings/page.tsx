import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { ConstructionTasksSettingsView } from "@/features/construction-tasks/views/construction-tasks-settings-view";
import { requireAuthContext } from "@/lib/auth";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Ajustes de Tareas | SEENCEL`,
        description: "Configuración de tareas de construcción",
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Page Component
// ============================================================================

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function ConstructionTasksSettingsPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const { orgId } = await requireAuthContext();

    return (
        <ConstructionTasksSettingsView
            organizationId={orgId}
        />
    );
}
