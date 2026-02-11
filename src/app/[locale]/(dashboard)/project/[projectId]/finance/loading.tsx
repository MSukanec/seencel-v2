import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Finanzas"
            messages={[
                "Traduciendo la obra a números…",
                "Sumando ingresos y egresos…",
                "Preparando el flujo financiero…",
            ]}
        />
    );
}
