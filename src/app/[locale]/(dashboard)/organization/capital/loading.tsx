import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Capital"
            messages={[
                "Calculando aportes y participaciones…",
                "Ajustando el balance de socios…",
                "Preparando el patrimonio del equipo…",
            ]}
        />
    );
}
