import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Materiales"
            messages={[
                "Preparando inventario de materiales…",
                "Organizando pedidos y stock…",
                "Cada material tiene su lugar…",
            ]}
        />
    );
}
