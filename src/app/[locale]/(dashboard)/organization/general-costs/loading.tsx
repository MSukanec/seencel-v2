import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Gastos Generales"
            messages={[
                "Calculando costos operativos…",
                "Sumando lo que sostiene la obra…",
                "Preparando el panorama de gastos…",
            ]}
        />
    );
}
