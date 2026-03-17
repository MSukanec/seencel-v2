import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Plantillas"
            messages={[
                "Cargando tus plantillas…",
                "Preparando el editor de documentos…",
            ]}
        />
    );
}
