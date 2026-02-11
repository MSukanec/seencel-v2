import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Finanzas"
            messages={[
                "Traduciendo la obra a números…",
                "Preparando tus movimientos…",
                "Calculando el pulso financiero…",
            ]}
        />
    );
}
