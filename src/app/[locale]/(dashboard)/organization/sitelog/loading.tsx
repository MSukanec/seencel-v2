import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Bitácora de Obra"
            messages={[
                "Cargando registros de obra…",
                "Reuniendo la memoria del proyecto…",
                "Cada día de obra queda registrado…",
            ]}
        />
    );
}
