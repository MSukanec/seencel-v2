import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Hub"
            messages={[
                "Preparando tu centro de comando…",
                "Reuniendo novedades del equipo…",
                "Cargando el pulso de la organización…",
            ]}
        />
    );
}
