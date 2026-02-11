import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Salud del Proyecto"
            messages={[
                "Tomando el pulso del proyecto…",
                "Evaluando avance y riesgos…",
                "Diagnosticando la obra…",
            ]}
        />
    );
}
