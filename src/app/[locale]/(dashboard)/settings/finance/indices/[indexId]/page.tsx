import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getIndexType, getIndexValues } from "@/features/advanced/queries";
import { ErrorDisplay } from "@/components/ui/error-display";
import { ContentLayout } from "@/components/layout";
import { IndexValuesView } from "@/features/advanced/views/index-values-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Detalle de Índice | Seencel",
        description: "Valores del índice económico",
        robots: "noindex, nofollow",
    };
}

interface Props {
    params: Promise<{ indexId: string }>;
}

export default async function IndexDetailPage({ params }: Props) {
    try {
        await requireAuthContext();
        const { indexId } = await params;
        const indexType = await getIndexType(indexId);

        if (!indexType) {
            return (
                <ContentLayout variant="wide">
                    <div className="h-full w-full flex items-center justify-center">
                        <ErrorDisplay
                            title="Índice no encontrado"
                            message="El índice solicitado no existe o fue eliminado."
                            retryLabel="Volver"
                        />
                    </div>
                </ContentLayout>
            );
        }

        return (
            <ContentLayout variant="wide">
                <IndexValuesView
                    organizationId={indexType.organization_id}
                    indexType={indexType}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <ContentLayout variant="wide">
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar índice"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Reintentar"
                    />
                </div>
            </ContentLayout>
        );
    }
}
