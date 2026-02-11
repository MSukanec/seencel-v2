import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            messages={[
                "Preparando tu espacio de trabajo…",
                "Cargando el dashboard…",
                "Ordenando la obra…",
            ]}
        />
    );
}
