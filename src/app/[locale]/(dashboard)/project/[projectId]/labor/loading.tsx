import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Mano de Obra"
            messages={[
                "Reuniendo al equipo de trabajo…",
                "Calculando horas y costos…",
                "Preparando el capital humano…",
            ]}
        />
    );
}
