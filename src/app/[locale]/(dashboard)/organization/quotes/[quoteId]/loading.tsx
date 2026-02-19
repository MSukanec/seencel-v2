import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Presupuesto"
            messages={[
                "Cargando presupuesto…",
                "Calculando totales e impuestos…",
                "Preparando ítems del presupuesto…",
            ]}
        />
    );
}
