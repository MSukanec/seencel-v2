import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Catálogo Técnico"
            messages={[
                "Organizando tu catálogo…",
                "Preparando tareas, materiales y mano de obra…",
                "Ordenando la obra, un recurso a la vez…",
            ]}
        />
    );
}
