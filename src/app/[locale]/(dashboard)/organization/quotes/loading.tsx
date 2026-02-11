import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Presupuestos"
            messages={[
                "Armando tus presupuestos…",
                "Sumando líneas y ajustando márgenes…",
                "Traduciendo alcance a precio…",
            ]}
        />
    );
}
