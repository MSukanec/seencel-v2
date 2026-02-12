import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
    return (
        <PageSkeleton
            title="Documentación"
            messages={[
                "Reuniendo tu documentación…",
                "Organizando documentos del equipo…",
                "Preparando tu biblioteca de documentos…",
            ]}
        />
    );
}
