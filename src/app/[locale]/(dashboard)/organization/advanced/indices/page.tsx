import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getIndexTypes } from "@/features/advanced/queries";
import { ErrorDisplay } from "@/components/ui/error-display";
import { AdvancedIndicesView } from "@/features/advanced/views/advanced-indices-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Índices Económicos | Seencel",
        description: "Índices económicos de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function IndicesPage() {
    try {
        const { orgId } = await requireAuthContext();
        const indexTypes = await getIndexTypes(orgId);

        return (
            <AdvancedIndicesView
                organizationId={orgId}
                indexTypes={indexTypes}
            />
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar índices económicos"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
