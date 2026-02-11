import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Avanzado"
            messages={[
                "Cargando configuración avanzada…",
                "Preparando herramientas especializadas…",
            ]}
        />
    );
}
