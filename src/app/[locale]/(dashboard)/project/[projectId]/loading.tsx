import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Proyecto"
            messages={[
                "Cargando los datos del proyecto…",
                "Preparando el centro de control…",
                "Reuniendo métricas y avances…",
            ]}
        />
    );
}
