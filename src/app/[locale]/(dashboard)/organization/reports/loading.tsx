import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Informes"
            messages={[
                "Generando tus reportes…",
                "Analizando datos para decisiones…",
                "Convirtiendo caos en claridad…",
            ]}
        />
    );
}
