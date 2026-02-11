import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Configuración"
            messages={[
                "Cargando tu configuración…",
                "Ajustando preferencias…",
                "Preparando tu espacio…",
            ]}
        />
    );
}
