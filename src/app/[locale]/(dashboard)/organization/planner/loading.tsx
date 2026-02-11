import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Planificador"
            messages={[
                "Cargando tu tablero de planificación…",
                "Organizando etapas y tareas…",
                "Preparando la visión del proyecto…",
            ]}
        />
    );
}
