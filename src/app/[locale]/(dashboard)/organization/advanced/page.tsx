import type { Metadata } from "next";
import { BrandPdfTemplates } from "@/features/organization/components/brand/brand-pdf-templates";
import { ErrorDisplay } from "@/components/ui/error-display";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Documentos PDF | Seencel",
        description: "Plantillas de documentos PDF de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function AdvancedPage() {
    try {
        return <BrandPdfTemplates />;
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar documentos"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
