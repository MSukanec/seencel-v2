import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Subcontratos"
            messages={[
                "Cargando contratos y proveedores…",
                "Preparando el estado de pagos…",
                "Organizando compromisos con terceros…",
            ]}
        />
    );
}
