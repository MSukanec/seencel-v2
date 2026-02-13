import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Notificaciones"
            messages={[
                "Cargando notificaciones…",
                "Preparando tu historial…",
            ]}
        />
    );
}
