import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Mi Perfil"
            messages={[
                "Cargando tu perfil…",
                "Preparando tus preferencias…",
            ]}
        />
    );
}
