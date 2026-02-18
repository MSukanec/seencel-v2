import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Cobros"
            messages={[
                "Cargando datos de clientes…",
                "Preparando compromisos y pagos…",
                "Organizando la información financiera…",
            ]}
        />
    );
}
