import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Clientes"
            messages={[
                "Reuniendo datos del cliente…",
                "Preparando clientes…",
                "Conectando el proyecto con su cliente…",
            ]}
        />
    );
}
