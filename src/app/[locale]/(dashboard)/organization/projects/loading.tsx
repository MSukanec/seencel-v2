import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Proyectos"
            messages={[
                "Cargando tus proyectos…",
                "Reuniendo el panorama de tu empresa…",
                "Cada obra cuenta una historia…",
            ]}
        />
    );
}
