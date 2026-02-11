import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Detalles del Proyecto"
            messages={[
                "Cargando los detalles…",
                "Preparando la ficha del proyecto…",
            ]}
        />
    );
}
