import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            messages={[
                "Cargando configuración…",
                "Preparando tus preferencias…",
            ]}
        />
    );
}
